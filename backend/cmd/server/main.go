package main

import (
	"context"
	"encoding/csv" // 追加
	"encoding/json"
	"errors"
	"fmt"
	"io" // 追加
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/asuka-sakamoto/security-system/backend/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"cloud.google.com/go/pubsub/v2"
	"cloud.google.com/go/storage" // 追加
	"connectrpc.com/connect"
	"github.com/rs/cors"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
	"golang.org/x/text/encoding/japanese" // 追加
	"golang.org/x/text/transform"         // 追加
	"google.golang.org/protobuf/types/known/timestamppb"

	securityv1 "github.com/asuka-sakamoto/security-system/gen/proto/security/v1"
	"github.com/asuka-sakamoto/security-system/gen/proto/security/v1/securityv1connect"
)

type SecurityServer struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func (s *SecurityServer) Ping(
	ctx context.Context,
	req *connect.Request[securityv1.PingRequest],
) (*connect.Response[securityv1.PingResponse], error) {
	fmt.Printf("Ping request received: %s\n", req.Msg.Message)
	return connect.NewResponse(&securityv1.PingResponse{
		Message: "Pong: " + req.Msg.Message,
	}), nil
}
func (s *SecurityServer) DeleteControl(
	ctx context.Context,
	req *connect.Request[securityv1.DeleteControlRequest],
) (*connect.Response[securityv1.DeleteControlResponse], error) {

	// DBから指定されたIDのControlを物理削除
	err := s.queries.DeleteControl(ctx, req.Msg.Id)
	if err != nil {
		log.Printf("Failed to delete control: %v", err)
		return nil, connect.NewError(connect.CodeInternal, errors.New("failed to delete control"))
	}

	return connect.NewResponse(&securityv1.DeleteControlResponse{
		Success: true,
	}), nil
}
func (s *SecurityServer) GetControl(
	ctx context.Context,
	req *connect.Request[securityv1.GetControlRequest],
) (*connect.Response[securityv1.GetControlResponse], error) {

	// sqlcが生成したクエリを呼び出し（JOINとarray_aggが効いた状態）
	row, err := s.queries.GetControl(ctx, req.Msg.Id)
	if err != nil {
		// pgx.ErrNoRows の場合は「見つからない」エラーを返す
		log.Printf("DB取得失敗: %v\n", err)
		return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("control not found: %s", req.Msg.Id))
	}

	// Protobufの型に詰め替え
	return connect.NewResponse(&securityv1.GetControlResponse{
		Control: &securityv1.Control{
			Id:       row.ID,
			Title:    row.Title,
			Category: row.Category,
			Question: row.Question,
			Answer:   row.Answer,
			Status:   row.Status,
			Version:  fmt.Sprintf("%d", row.Version), // string型で定義されている場合
			Tags:     row.Tags,
		},
	}), nil
}

func (s *SecurityServer) CreateControl(ctx context.Context, req *connect.Request[securityv1.CreateControlRequest]) (*connect.Response[securityv1.CreateControlResponse], error) {
	// 1. 新しいIDの生成
	newID := uuid.New().String()

	// 2. トランザクションの開始
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to begin transaction: %w", err))
	}
	// 関数を抜ける時に、もしCommitされていなければRollback（キャンセル）する安全装置
	defer tx.Rollback(ctx)

	// トランザクション上で動く queries を作成
	qtx := s.queries.WithTx(tx)

	// 3. Control 本体を保存
	ctrl, err := qtx.CreateControl(ctx, db.CreateControlParams{
		ID:       newID,
		Title:    req.Msg.Title,
		Question: req.Msg.Question,
		Answer:   req.Msg.Answer,
		Category: req.Msg.Category,
		Status:   "active", // 初期ステータス
		Version:  1,        // 初期バージョン
	})
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to create control: %w", err))
	}

	// 4. タグの保存と紐付け（ループ処理）
	for _, tagName := range req.Msg.Tags {
		if tagName == "" {
			continue
		}
		// タグをUpsert（なければ作成、あれば既存のIDを取得）
		tagID, err := qtx.UpsertTag(ctx, tagName)
		if err != nil {
			return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to upsert tag '%s': %w", tagName, err))
		}

		// Control と Tag を交差テーブルで紐付け
		err = qtx.LinkControlTag(ctx, db.LinkControlTagParams{
			ControlID: ctrl.ID,
			TagID:     tagID,
		})
		if err != nil {
			return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to link tag '%s': %w", tagName, err))
		}
	}
	if req.Msg.UnmatchedTaskId != "" {
		// 文字列で送られてきたIDを数値(int32)に変換
		taskIDInt, err := strconv.Atoi(req.Msg.UnmatchedTaskId)
		if err == nil {
			// トランザクション (qtx) を使って更新
			updateErr := qtx.UpdateUnmatchedTaskStatus(ctx, db.UpdateUnmatchedTaskStatusParams{
				ID: int32(taskIDInt),
				// db.NullUnmatchedStatus 型に合わせて設定
				Status: db.NullUnmatchedStatus{
					UnmatchedStatus: db.UnmatchedStatus("completed"), // "completed" に更新
					Valid:           true,
				},
			})
			if updateErr != nil {
				// ステータス更新失敗時はトランザクションごとロールバック（エラーを返す）
				return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to update unmatched task status: %w", updateErr))
			}
			log.Printf(" 未マッチタスク (ID: %d) を completed に更新しました", taskIDInt)
		} else {
			log.Printf("警告: 不正な UnmatchedTaskId フォーマット (%s): %v", req.Msg.UnmatchedTaskId, err)
			// ID形式が不正な場合は、無視してControl作成だけは続行するか、エラーにするか選べます。
			// 今回はログだけ出して続行する形にしています。
		}
	}

	// 5. すべて成功したらコミット（確定）
	if err := tx.Commit(ctx); err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to commit transaction: %w", err))
	}

	// 6. フロントエンドに返すレスポンスを作成
	return connect.NewResponse(&securityv1.CreateControlResponse{
		Control: &securityv1.Control{
			Id:       ctrl.ID,
			Title:    ctrl.Title,
			Category: ctrl.Category,
			Tags:     req.Msg.Tags, // 送られてきたタグをそのまま返す
			Question: ctrl.Question,
			Answer:   ctrl.Answer,
			Status:   ctrl.Status,
		},
	}), nil
}

func (s *SecurityServer) SearchControls(
	ctx context.Context,
	req *connect.Request[securityv1.SearchControlsRequest],
) (*connect.Response[securityv1.SearchControlsResponse], error) {

	queryStr := req.Msg.Query

	rows, err := s.queries.SearchControls(ctx, pgtype.Text{
		String: queryStr,
		Valid:  true, // NULLではなく、有効な文字列として扱う
	})
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("search failed: %w", err))
	}

	results := make([]*securityv1.Control, 0, len(rows))
	for _, row := range rows {
		results = append(results, &securityv1.Control{
			Id:       row.ID,
			Title:    row.Title,
			Category: row.Category,
			Question: row.Question,
			Answer:   row.Answer,
			Status:   row.Status,
			// エラー解決①: int32 を string に変換
			Version: fmt.Sprintf("%d", row.Version),
			Tags:    row.Tags,
		})
	}

	return connect.NewResponse(&securityv1.SearchControlsResponse{
		Hits: results,
	}), nil
}

func (s *SecurityServer) ListUnmatchedTasks(
	ctx context.Context,
	req *connect.Request[securityv1.ListUnmatchedTasksRequest],
) (*connect.Response[securityv1.ListUnmatchedTasksResponse], error) {

	// DB クエリ実行用の Querier を作成
	querier := db.New(s.pool)

	// DB から pending 状態の未マッチタスクを 50 件取得（Limit: 50, Offset: 0）
	dbTasks, err := querier.ListPendingUnmatchedTasks(ctx, db.ListPendingUnmatchedTasksParams{
		Limit:  50,
		Offset: 0,
	})
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch unmatched tasks: %v", err))
	}

	// DB の結果を Protocol Buffers の型に変換
	var protoTasks []*securityv1.UnmatchedTask
	for _, t := range dbTasks {
		protoTasks = append(protoTasks, &securityv1.UnmatchedTask{
			Id:               t.ID,
			OriginalFileName: t.OriginalFileName,
			RowNumber:        t.RowNumber,
			QuestionText:     t.QuestionText,
			Status:           string(t.Status.UnmatchedStatus),
		})
	}

	// レスポンスを返す
	res := connect.NewResponse(&securityv1.ListUnmatchedTasksResponse{
		Tasks: protoTasks,
	})
	return res, nil
}

func (s *SecurityServer) ListFeedEvents(ctx context.Context, req *connect.Request[securityv1.ListFeedEventsRequest]) (*connect.Response[securityv1.ListFeedEventsResponse], error) {
	rows, err := s.queries.ListFeedEvents(ctx)
	if err != nil {
		log.Printf("Failed to fetch feed events: %v\n", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch feed events: %w", err))
	}

	events := make([]*securityv1.FeedEvent, 0, len(rows))
	for _, row := range rows {
		// ControlIDのNULLチェック
		controlID := ""
		if row.ControlID.Valid {
			controlID = row.ControlID.String
		}

		// DescriptionのNULLチェック
		description := ""
		if row.Description.Valid {
			description = row.Description.String
		}

		controlTitle := "削除されたControl" // デフォルト値（JOINに失敗した場合など）
		if row.ControlTitle.Valid {
			controlTitle = row.ControlTitle.String // NULLでなければ中身を使う
		}

		events = append(events, &securityv1.FeedEvent{
			Id:           row.ID,
			EventType:    string(row.EventType),
			ControlId:    controlID,
			UserName:     row.UserName,
			Description:  description,
			CreatedAt:    timestamppb.New(row.CreatedAt.Time),
			ControlTitle: controlTitle, // ここでタイトルもセット
		})
	}

	return connect.NewResponse(&securityv1.ListFeedEventsResponse{
		Events: events,
	}), nil
}

func (s *SecurityServer) ListControls(
	ctx context.Context,
	req *connect.Request[securityv1.ListControlsRequest],
) (*connect.Response[securityv1.ListControlsResponse], error) {

	// sqlcの一覧取得クエリを呼び出し
	rows, err := s.queries.ListControls(ctx)
	if err != nil {
		// ↓↓↓ ここが超重要！ターミナルに本当のエラー原因を出力します ↓↓↓
		log.Printf("[緊急エラー確認] DB取得失敗: %v\n", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch controls: %w", err))
	}

	controls := make([]*securityv1.Control, 0, len(rows))
	for _, row := range rows {
		controls = append(controls, &securityv1.Control{
			Id:       row.ID,
			Title:    row.Title,
			Category: row.Category,
			Status:   row.Status,
			Version:  fmt.Sprintf("%d", row.Version),
			Tags:     row.Tags,
			Question: row.Question,
			Answer:   row.Answer,
		})
	}

	return connect.NewResponse(&securityv1.ListControlsResponse{
		Controls: controls,
	}), nil
}
func startPubSubListener(projectID string, subID string, dbPool *pgxpool.Pool) {
	ctx := context.Background()

	// Pub/Sub クライアントの作成
	client, err := pubsub.NewClient(ctx, projectID)
	if err != nil {
		fmt.Printf("Failed to create Pub/Sub client: %v\n", err)
		return
	}
	defer client.Close()

	// GCS クライアントの作成（追加）
	storageClient, err := storage.NewClient(ctx)
	if err != nil {
		fmt.Printf("Failed to create Storage client: %v\n", err)
		return
	}
	defer storageClient.Close()

	sub := client.Subscriber(subID)
	log.Printf("Listening for messages on subscription: %s\n", subID)
	err = sub.Receive(ctx, func(ctx context.Context, msg *pubsub.Message) {
		fileName := msg.Attributes["objectId"]
		eventType := msg.Attributes["eventType"]
		bucketId := msg.Attributes["bucketId"] // GCSからの通知にはバケット名が含まれます

		if eventType == "OBJECT_FINALIZE" {
			log.Printf("New file uploaded: %s (Bucket: %s)\n", fileName, bucketId)

			// ★ 非同期でファイルのダウンロードと解析を実行
			go func() {
				err := processUploadedCSV(context.Background(), storageClient, bucketId, fileName, dbPool)
				if err != nil {
					log.Printf(" CSV処理エラー (%s): %v\n", fileName, err)
				}
			}()
		} else {
			log.Printf("Received non-finalize event: %s for file: %s\n", eventType, fileName)
		}
		// メッセージの処理が完了したらAck（確認応答）を返す
		msg.Ack()
	})
	if err != nil {
		fmt.Printf("Error receiving messages: %v\n", err)
	}
}

func processUploadedCSV(ctx context.Context, client *storage.Client, bucketName, fileName string, dbPool *pgxpool.Pool) error {
	log.Printf("%s から %s をダウンロード中...\n", bucketName, fileName)

	// GCSからオブジェクトを読み取る
	rc, err := client.Bucket(bucketName).Object(fileName).NewReader(ctx)
	if err != nil {
		return fmt.Errorf("failed to read object from GCS: %w", err)
	}
	defer rc.Close()

	// 日本語ExcelのShift-JISをUTF-8に変換
	utf8Reader := transform.NewReader(rc, japanese.ShiftJIS.NewDecoder())
	csvReader := csv.NewReader(utf8Reader)
	csvReader.FieldsPerRecord = -1

	// SQL生成用のQuerierを準備
	querier := db.New(dbPool)

	rowCount := 0
	savedCount := 0

	log.Printf(" %s の解析とDB保存を開始します...", fileName)

	for {
		record, err := csvReader.Read()
		if err == io.EOF {
			break // ファイルの終端
		}
		if err != nil {
			return fmt.Errorf("failed to parse CSV at line %d: %w", rowCount+1, err)
		}

		rowCount++

		// 1. 1行目（ヘッダー）は保存せずにスキップ
		if rowCount == 1 {
			continue
		}

		// 2. CSVのどの列に「質問」が入っているかを確認
		// ここでは index 0 (1列目) を質問文として扱います
		// もし2列目なら record[1] に変更してください
		var questionText string
		if len(record) >= 3 {
			questionText = record[2] // 0, 1, 2番目が「質問内容」
		}

		// 3. 質問文が空でなければDBに保存
		if questionText != "" {
			_, err := querier.CreateUnmatchedTask(ctx, db.CreateUnmatchedTaskParams{
				OriginalFileName: fileName,
				RowNumber:        int32(rowCount),
				QuestionText:     questionText,
			})
			if err != nil {
				log.Printf(" 行 %d の保存に失敗: %v\n", rowCount, err)
			} else {
				savedCount++
			}
		}
	}

	log.Printf(" %s の処理が完了しました（総行数: %d, DB保存数: %d）\n", fileName, rowCount, savedCount)
	return nil
}

func main() {
	ctx := context.Background()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/security?sslmode=disable"
	}
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer pool.Close()
	queries := db.New(pool)
	securityServer := &SecurityServer{
		pool:    pool,
		queries: queries,
	}
	mux := http.NewServeMux()
	pathName, handler := securityv1connect.NewSecurityServiceHandler(securityServer)
	mux.Handle(pathName, handler)
	go startPubSubListener("welcome-study-sakamoto", "ingestion-subscription", pool)
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:3000"},
		AllowedMethods: []string{"POST", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type", "Connect-Protocol-Version"},
	})

	fmt.Printf(" Server is running on http://localhost:8080\n")
	if err := http.ListenAndServe(":8080", c.Handler(h2c.NewHandler(mux, &http2.Server{}))); err != nil {
		fmt.Printf("Failed to start server: %v\n", err)
	}
}
func (s *SecurityServer) UpdateControl(
	ctx context.Context,
	req *connect.Request[securityv1.UpdateControlRequest],
) (*connect.Response[securityv1.UpdateControlResponse], error) {

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to begin tx: %w", err))
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	oldControl, err := qtx.GetControl(ctx, req.Msg.Id)
	if err != nil {
		return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("control not found: %w", err))
	}

	var oldTagsJSON []byte
	if len(oldControl.Tags) > 0 {
		oldTagsJSON, _ = json.Marshal(oldControl.Tags)
	} else {
		oldTagsJSON = []byte("[]")
	}

	// 履歴の保存
	_, err = qtx.CreateControlVersion(ctx, db.CreateControlVersionParams{
		ControlID: pgtype.Text{String: oldControl.ID, Valid: true},
		Version:   oldControl.Version,
		Title:     oldControl.Title,
		Category:  oldControl.Category,
		Tags:      oldTagsJSON,
		Question:  oldControl.Question,
		Answer:    oldControl.Answer,
		CreatedBy: pgtype.Text{String: "system", Valid: true},
	})
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to create version: %w", err))
	}

	updatedControl, err := qtx.UpdateControl(ctx, db.UpdateControlParams{
		ID:       req.Msg.Id,
		Title:    req.Msg.Title,
		Category: req.Msg.Category,
		Question: req.Msg.Question,
		Answer:   req.Msg.Answer,
		Status:   oldControl.Status,      // 元のステータスを維持
		Version:  oldControl.Version + 1, // バージョンを確実に上げる！
	})
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to update control: %w", err))
	}

	err = qtx.DeleteControlTags(ctx, req.Msg.Id)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to delete old tags: %w", err))
	}

	for _, tagName := range req.Msg.Tags {
		tagID, err := qtx.UpsertTag(ctx, tagName)
		if err != nil {
			return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to upsert tag: %w", err))
		}
		err = qtx.LinkControlTag(ctx, db.LinkControlTagParams{
			ControlID: req.Msg.Id,
			TagID:     tagID,
		})
		if err != nil {
			return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to link tag: %w", err))
		}
	}

	description := fmt.Sprintf("「%s」が更新されました (v%d → v%d)", updatedControl.Title, oldControl.Version, updatedControl.Version)
	_, err = qtx.CreateFeedEvent(ctx, db.CreateFeedEventParams{
		EventType:   db.FeedEventTypeUpdated,
		ControlID:   pgtype.Text{String: req.Msg.Id, Valid: true},
		UserName:    "system",
		Description: pgtype.Text{String: description, Valid: true},
	})
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to create feed event: %w", err))
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to commit tx: %w", err))
	}

	return connect.NewResponse(&securityv1.UpdateControlResponse{
		Control: &securityv1.Control{
			Id:       updatedControl.ID,
			Title:    updatedControl.Title,
			Category: updatedControl.Category,
			Status:   updatedControl.Status,
			Version:  fmt.Sprintf("%d", updatedControl.Version),
			Tags:     req.Msg.Tags,
			Question: updatedControl.Question,
			Answer:   updatedControl.Answer,
		},
	}), nil
}
