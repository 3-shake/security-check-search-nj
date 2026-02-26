package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/asuka-sakamoto/security-system/backend/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"cloud.google.com/go/pubsub/v2"
	"connectrpc.com/connect"
	"github.com/rs/cors"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"

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

func (s *SecurityServer) GetControl(ctx context.Context, req *connect.Request[securityv1.GetControlRequest]) (*connect.Response[securityv1.GetControlResponse], error) {
	// 自動生成された sqlc の関数を呼び出す
	row, err := s.queries.GetControl(ctx, req.Msg.Id)
	if err != nil {
		return nil, connect.NewError(connect.CodeNotFound, errors.New("control not found"))
	}

	return connect.NewResponse(&securityv1.GetControlResponse{
		Control: &securityv1.Control{
			Id:       row.ID,
			Title:    row.Title,
			Category: row.Category,
			Tags:     row.Tags, // 正規化した配列
			Question: row.Question,
			Answer:   row.Answer,
			Status:   row.Status,
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

func (s *SecurityServer) SearchControls(ctx context.Context, req *connect.Request[securityv1.SearchControlsRequest]) (*connect.Response[securityv1.SearchControlsResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}

func (s *SecurityServer) ListUnmatchedTasks(ctx context.Context, req *connect.Request[securityv1.ListUnmatchedTasksRequest]) (*connect.Response[securityv1.ListUnmatchedTasksResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}

func (s *SecurityServer) ListFeedEvents(ctx context.Context, req *connect.Request[securityv1.ListFeedEventsRequest]) (*connect.Response[securityv1.ListFeedEventsResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}

// 修正ポイント: ListControllers ではなく ListControls に変更
func (s *SecurityServer) ListControls(
	ctx context.Context,
	req *connect.Request[securityv1.ListControlsRequest],
) (*connect.Response[securityv1.ListControlsResponse], error) {
	return connect.NewResponse(&securityv1.ListControlsResponse{}), nil
}

func startPubSubListener(projectID string, subID string) {
	ctx := context.Background()
	client, err := pubsub.NewClient(ctx, projectID)
	if err != nil {
		fmt.Printf("Failed to create Pub/Sub client: %v\n", err)
		return
	}
	defer client.Close()

	sub := client.Subscriber(subID)
	log.Printf("Listening for messages on subscription: %s\n", subID)
	err = sub.Receive(ctx, func(ctx context.Context, msg *pubsub.Message) {
		fileName := msg.Attributes["objectId"]
		eventType := msg.Attributes["eventType"]
		if eventType == "OBJECT_FINALIZE" {
			log.Printf("New file uploaded: %s\n", fileName)
			// ここでファイル処理のロジックを実装
		} else {
			log.Printf("Received non-finalize event: %s for file: %s\n", eventType, fileName)
		}
		msg.Ack()
	})
	if err != nil {
		fmt.Printf("Error receiving messages: %v\n", err)
	}
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
	go startPubSubListener("welcome-study-sakamoto", "ingestion-subscription")
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
