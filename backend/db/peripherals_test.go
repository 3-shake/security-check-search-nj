package db

import (
	"context"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/pashagolub/pgxmock/v4"
)

// ─────────────────────────────────────────────────────
// CreateFeedEvent
// ─────────────────────────────────────────────────────
func TestCreateFeedEvent(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	q := New(mock)
	now := time.Now()
	ts := pgtype.Timestamptz{Time: now, Valid: true}

	rows := mock.NewRows([]string{
		"id", "event_type", "control_id", "user_name", "description", "created_at",
	}).AddRow(
		int32(1),
		FeedEventTypeCreated,
		pgtype.Text{String: "CTL-001", Valid: true},
		"yamada",
		pgtype.Text{String: "新規作成", Valid: true},
		ts,
	)

	mock.ExpectQuery("INSERT INTO feed_events").
		WithArgs(
			FeedEventTypeCreated,
			pgtype.Text{String: "CTL-001", Valid: true},
			"yamada",
			pgtype.Text{String: "新規作成", Valid: true},
		).
		WillReturnRows(rows)

	params := CreateFeedEventParams{
		EventType:   FeedEventTypeCreated,
		ControlID:   pgtype.Text{String: "CTL-001", Valid: true},
		UserName:    "yamada",
		Description: pgtype.Text{String: "新規作成", Valid: true},
	}

	got, err := q.CreateFeedEvent(context.Background(), params)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.ID != 1 {
		t.Errorf("CreateFeedEvent().ID = %d, want 1", got.ID)
	}
	if got.EventType != FeedEventTypeCreated {
		t.Errorf("CreateFeedEvent().EventType = %q, want %q", got.EventType, FeedEventTypeCreated)
	}
	if got.UserName != "yamada" {
		t.Errorf("CreateFeedEvent().UserName = %q, want %q", got.UserName, "yamada")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// ─────────────────────────────────────────────────────
// ListFeedEvents
// ─────────────────────────────────────────────────────
func TestListFeedEvents(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	q := New(mock)
	now := time.Now()
	ts := pgtype.Timestamptz{Time: now, Valid: true}

	rows := mock.NewRows([]string{
		"id", "event_type", "control_id", "user_name", "description", "created_at", "control_title",
	}).
		AddRow(
			int32(2), FeedEventTypeUpdated,
			pgtype.Text{String: "CTL-001", Valid: true},
			"suzuki",
			pgtype.Text{String: "回答を更新", Valid: true},
			ts,
			pgtype.Text{String: "MFA認証", Valid: true},
		).
		AddRow(
			int32(1), FeedEventTypeCreated,
			pgtype.Text{String: "CTL-002", Valid: true},
			"tanaka",
			pgtype.Text{String: "新規作成", Valid: true},
			ts,
			pgtype.Text{String: "暗号化ポリシー", Valid: true},
		)

	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	got, err := q.ListFeedEvents(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("ListFeedEvents() returned %d rows, want 2", len(got))
	}
	if got[0].ID != 2 {
		t.Errorf("ListFeedEvents()[0].ID = %d, want 2", got[0].ID)
	}
	if got[0].ControlTitle.String != "MFA認証" {
		t.Errorf("ListFeedEvents()[0].ControlTitle = %q, want %q", got[0].ControlTitle.String, "MFA認証")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

func TestListFeedEvents_Empty(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	q := New(mock)
	rows := mock.NewRows([]string{
		"id", "event_type", "control_id", "user_name", "description", "created_at", "control_title",
	})
	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	got, err := q.ListFeedEvents(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != nil {
		t.Errorf("ListFeedEvents() on empty = %v, want nil", got)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// ─────────────────────────────────────────────────────
// CreateUnmatchedTask
// ─────────────────────────────────────────────────────
func TestCreateUnmatchedTask(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	q := New(mock)
	now := time.Now()
	ts := pgtype.Timestamptz{Time: now, Valid: true}

	rows := mock.NewRows([]string{
		"id", "original_file_name", "row_number", "question_text", "status", "created_at", "resolved_at",
	}).AddRow(
		int32(1), "checklist.csv", int32(5), "MFAは導入していますか？",
		NullUnmatchedStatus{UnmatchedStatus: UnmatchedStatusPending, Valid: true},
		ts,
		pgtype.Timestamptz{Valid: false},
	)

	mock.ExpectQuery("INSERT INTO unmatched_tasks").
		WithArgs("checklist.csv", int32(5), "MFAは導入していますか？").
		WillReturnRows(rows)

	params := CreateUnmatchedTaskParams{
		OriginalFileName: "checklist.csv",
		RowNumber:        5,
		QuestionText:     "MFAは導入していますか？",
	}

	got, err := q.CreateUnmatchedTask(context.Background(), params)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.ID != 1 {
		t.Errorf("CreateUnmatchedTask().ID = %d, want 1", got.ID)
	}
	if got.OriginalFileName != "checklist.csv" {
		t.Errorf("CreateUnmatchedTask().OriginalFileName = %q, want %q", got.OriginalFileName, "checklist.csv")
	}
	if got.QuestionText != "MFAは導入していますか？" {
		t.Errorf("CreateUnmatchedTask().QuestionText = %q, want %q", got.QuestionText, "MFAは導入していますか？")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// ─────────────────────────────────────────────────────
// ListPendingUnmatchedTasks
// ─────────────────────────────────────────────────────
func TestListPendingUnmatchedTasks(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	q := New(mock)
	now := time.Now()
	ts := pgtype.Timestamptz{Time: now, Valid: true}

	rows := mock.NewRows([]string{
		"id", "original_file_name", "row_number", "question_text", "status", "created_at", "resolved_at",
	}).
		AddRow(
			int32(1), "sheet.csv", int32(3), "暗号化は？",
			NullUnmatchedStatus{UnmatchedStatus: UnmatchedStatusPending, Valid: true},
			ts, pgtype.Timestamptz{Valid: false},
		).
		AddRow(
			int32(2), "sheet.csv", int32(7), "ログ管理は？",
			NullUnmatchedStatus{UnmatchedStatus: UnmatchedStatusPending, Valid: true},
			ts, pgtype.Timestamptz{Valid: false},
		)

	mock.ExpectQuery("SELECT").
		WithArgs(int32(50), int32(0)).
		WillReturnRows(rows)

	params := ListPendingUnmatchedTasksParams{Limit: 50, Offset: 0}
	got, err := q.ListPendingUnmatchedTasks(context.Background(), params)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("ListPendingUnmatchedTasks() returned %d rows, want 2", len(got))
	}
	if got[0].QuestionText != "暗号化は？" {
		t.Errorf("ListPendingUnmatchedTasks()[0].QuestionText = %q, want %q", got[0].QuestionText, "暗号化は？")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// ─────────────────────────────────────────────────────
// UpdateUnmatchedTaskStatus
// ─────────────────────────────────────────────────────
func TestUpdateUnmatchedTaskStatus(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	q := New(mock)
	mock.ExpectExec("UPDATE unmatched_tasks").
		WithArgs(int32(1), NullUnmatchedStatus{UnmatchedStatus: UnmatchedStatusResolved, Valid: true}).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	params := UpdateUnmatchedTaskStatusParams{
		ID:     1,
		Status: NullUnmatchedStatus{UnmatchedStatus: UnmatchedStatusResolved, Valid: true},
	}

	err = q.UpdateUnmatchedTaskStatus(context.Background(), params)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}
