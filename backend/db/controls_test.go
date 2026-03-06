package db

import (
	"context"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/pashagolub/pgxmock/v4"
)

// ─────────────────────────────────────────────────────
// CountControls
// ─────────────────────────────────────────────────────
func TestCountControls(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	q := New(mock)
	rows := mock.NewRows([]string{"count"}).AddRow(int64(42))
	mock.ExpectQuery("SELECT COUNT").WillReturnRows(rows)

	got, err := q.CountControls(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != 42 {
		t.Errorf("CountControls() = %d, want 42", got)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// ─────────────────────────────────────────────────────
// CreateControl
// ─────────────────────────────────────────────────────
func TestCreateControl(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	q := New(mock)
	now := time.Now()
	ts := pgtype.Timestamptz{Time: now, Valid: true}

	rows := mock.NewRows([]string{
		"id", "title", "category", "question", "answer", "status", "version", "created_at", "updated_at",
	}).AddRow("CTL-001", "テスト", "認証", "質問", "回答", "active", int32(1), ts, ts)

	mock.ExpectQuery("INSERT INTO controls").
		WithArgs("CTL-001", "テスト", "質問", "回答", "認証", "active", int32(1)).
		WillReturnRows(rows)

	params := CreateControlParams{
		ID:       "CTL-001",
		Title:    "テスト",
		Question: "質問",
		Answer:   "回答",
		Category: "認証",
		Status:   "active",
		Version:  1,
	}

	got, err := q.CreateControl(context.Background(), params)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.ID != "CTL-001" {
		t.Errorf("CreateControl().ID = %q, want %q", got.ID, "CTL-001")
	}
	if got.Title != "テスト" {
		t.Errorf("CreateControl().Title = %q, want %q", got.Title, "テスト")
	}
	if got.Version != 1 {
		t.Errorf("CreateControl().Version = %d, want 1", got.Version)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// ─────────────────────────────────────────────────────
// GetControl
// ─────────────────────────────────────────────────────
func TestGetControl(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	q := New(mock)
	now := time.Now()
	ts := pgtype.Timestamptz{Time: now, Valid: true}

	rows := mock.NewRows([]string{
		"id", "title", "category", "question", "answer", "status", "version", "created_at", "updated_at", "tags",
	}).AddRow("CTL-001", "テスト", "認証", "質問?", "回答!", "active", int32(2), ts, ts, []string{"tag1", "tag2"})

	mock.ExpectQuery("SELECT").WithArgs("CTL-001").WillReturnRows(rows)

	got, err := q.GetControl(context.Background(), "CTL-001")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.ID != "CTL-001" {
		t.Errorf("GetControl().ID = %q, want %q", got.ID, "CTL-001")
	}
	if len(got.Tags) != 2 {
		t.Errorf("GetControl().Tags length = %d, want 2", len(got.Tags))
	}
	if got.Tags[0] != "tag1" {
		t.Errorf("GetControl().Tags[0] = %q, want %q", got.Tags[0], "tag1")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

func TestGetControl_NotFound(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	q := New(mock)
	rows := mock.NewRows([]string{
		"id", "title", "category", "question", "answer", "status", "version", "created_at", "updated_at", "tags",
	})
	mock.ExpectQuery("SELECT").WithArgs("NONEXISTENT").WillReturnRows(rows)

	_, err = q.GetControl(context.Background(), "NONEXISTENT")
	if err == nil {
		t.Error("expected error for non-existent control, got nil")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// ─────────────────────────────────────────────────────
// UpdateControl
// ─────────────────────────────────────────────────────
func TestUpdateControl(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	q := New(mock)
	now := time.Now()
	ts := pgtype.Timestamptz{Time: now, Valid: true}

	rows := mock.NewRows([]string{
		"id", "title", "category", "question", "answer", "status", "version", "created_at", "updated_at",
	}).AddRow("CTL-001", "更新後", "ネットワーク", "新しい質問", "新しい回答", "active", int32(2), ts, ts)

	mock.ExpectQuery("UPDATE controls").
		WithArgs("CTL-001", "更新後", "ネットワーク", "新しい質問", "新しい回答", "active", int32(2)).
		WillReturnRows(rows)

	params := UpdateControlParams{
		ID:       "CTL-001",
		Title:    "更新後",
		Category: "ネットワーク",
		Question: "新しい質問",
		Answer:   "新しい回答",
		Status:   "active",
		Version:  2,
	}

	got, err := q.UpdateControl(context.Background(), params)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.Title != "更新後" {
		t.Errorf("UpdateControl().Title = %q, want %q", got.Title, "更新後")
	}
	if got.Version != 2 {
		t.Errorf("UpdateControl().Version = %d, want 2", got.Version)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// ─────────────────────────────────────────────────────
// DeleteControl
// ─────────────────────────────────────────────────────
func TestDeleteControl(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	q := New(mock)
	mock.ExpectExec("DELETE FROM controls").
		WithArgs("CTL-001").
		WillReturnResult(pgxmock.NewResult("DELETE", 1))

	err = q.DeleteControl(context.Background(), "CTL-001")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// ─────────────────────────────────────────────────────
// ListControls
// ─────────────────────────────────────────────────────
func TestListControls(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	q := New(mock)
	now := time.Now()
	ts := pgtype.Timestamptz{Time: now, Valid: true}

	rows := mock.NewRows([]string{
		"id", "title", "category", "question", "answer", "status", "version", "created_at", "updated_at", "tags",
	}).
		AddRow("CTL-001", "タイトル1", "認証", "Q1", "A1", "active", int32(1), ts, ts, []string{"tag1"}).
		AddRow("CTL-002", "タイトル2", "暗号", "Q2", "A2", "draft", int32(1), ts, ts, []string{})

	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	got, err := q.ListControls(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("ListControls() returned %d rows, want 2", len(got))
	}
	if got[0].ID != "CTL-001" {
		t.Errorf("ListControls()[0].ID = %q, want %q", got[0].ID, "CTL-001")
	}
	if got[1].Status != "draft" {
		t.Errorf("ListControls()[1].Status = %q, want %q", got[1].Status, "draft")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

func TestListControls_Empty(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	q := New(mock)
	rows := mock.NewRows([]string{
		"id", "title", "category", "question", "answer", "status", "version", "created_at", "updated_at", "tags",
	})
	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	got, err := q.ListControls(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != nil {
		t.Errorf("ListControls() on empty = %v, want nil", got)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// ─────────────────────────────────────────────────────
// ListControlsPaginated
// ─────────────────────────────────────────────────────
func TestListControlsPaginated(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	q := New(mock)
	now := time.Now()
	ts := pgtype.Timestamptz{Time: now, Valid: true}

	rows := mock.NewRows([]string{
		"id", "title", "category", "question", "answer", "status", "version", "created_at", "updated_at", "tags",
	}).AddRow("CTL-003", "ページ2", "認証", "Q3", "A3", "active", int32(1), ts, ts, []string{"tag1"})

	mock.ExpectQuery("SELECT").
		WithArgs(int32(10), int32(10)).
		WillReturnRows(rows)

	params := ListControlsPaginatedParams{Limit: 10, Offset: 10}
	got, err := q.ListControlsPaginated(context.Background(), params)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 1 {
		t.Fatalf("ListControlsPaginated() returned %d rows, want 1", len(got))
	}
	if got[0].ID != "CTL-003" {
		t.Errorf("ListControlsPaginated()[0].ID = %q, want %q", got[0].ID, "CTL-003")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// ─────────────────────────────────────────────────────
// UpsertTag
// ─────────────────────────────────────────────────────
func TestUpsertTag(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	q := New(mock)
	rows := mock.NewRows([]string{"id"}).AddRow(int32(5))
	mock.ExpectQuery("INSERT INTO tags").WithArgs("MFA").WillReturnRows(rows)

	got, err := q.UpsertTag(context.Background(), "MFA")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != 5 {
		t.Errorf("UpsertTag() = %d, want 5", got)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// ─────────────────────────────────────────────────────
// LinkControlTag
// ─────────────────────────────────────────────────────
func TestLinkControlTag(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	q := New(mock)
	mock.ExpectExec("INSERT INTO control_tags").
		WithArgs("CTL-001", int32(5)).
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	err = q.LinkControlTag(context.Background(), LinkControlTagParams{
		ControlID: "CTL-001",
		TagID:     5,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// ─────────────────────────────────────────────────────
// DeleteControlTags
// ─────────────────────────────────────────────────────
func TestDeleteControlTags(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	q := New(mock)
	mock.ExpectExec("DELETE FROM control_tags").
		WithArgs("CTL-001").
		WillReturnResult(pgxmock.NewResult("DELETE", 3))

	err = q.DeleteControlTags(context.Background(), "CTL-001")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// ─────────────────────────────────────────────────────
// GetControlsByIDs
// ─────────────────────────────────────────────────────
func TestGetControlsByIDs(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	q := New(mock)
	rows := mock.NewRows([]string{
		"id", "title", "category", "question", "answer", "status", "version", "tags",
	}).
		AddRow("CTL-001", "タイトル1", "認証", "Q1", "A1", "active", int32(1), []string{"tag1"}).
		AddRow("CTL-002", "タイトル2", "暗号", "Q2", "A2", "active", int32(1), []string{})

	mock.ExpectQuery("SELECT").
		WithArgs([]string{"CTL-001", "CTL-002"}).
		WillReturnRows(rows)

	got, err := q.GetControlsByIDs(context.Background(), []string{"CTL-001", "CTL-002"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("GetControlsByIDs() returned %d rows, want 2", len(got))
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// ─────────────────────────────────────────────────────
// CountPendingUnmatchedTasks
// ─────────────────────────────────────────────────────
func TestCountPendingUnmatchedTasks(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	q := New(mock)
	rows := mock.NewRows([]string{"count"}).AddRow(int64(7))
	mock.ExpectQuery("SELECT COUNT").WillReturnRows(rows)

	got, err := q.CountPendingUnmatchedTasks(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != 7 {
		t.Errorf("CountPendingUnmatchedTasks() = %d, want 7", got)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// ─────────────────────────────────────────────────────
// CountRecentTeamUpdates
// ─────────────────────────────────────────────────────
func TestCountRecentTeamUpdates(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	q := New(mock)
	rows := mock.NewRows([]string{"count"}).AddRow(int64(15))
	mock.ExpectQuery("SELECT COUNT").WillReturnRows(rows)

	got, err := q.CountRecentTeamUpdates(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != 15 {
		t.Errorf("CountRecentTeamUpdates() = %d, want 15", got)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}
