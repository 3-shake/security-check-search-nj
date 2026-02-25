import { NextResponse } from "next/server";

const mockUnmatchedTasks = [
    {
        id: 'TASK-0001',
        sourceFile:"A社_2025-03-01_セキュリティチェック.csv",
        rowNumber: 15,
        originalQuestion: 'SaaS環境におけるデータの暗号化方式について詳細を記載してください。',
        suggestedControl: {
      id: "BASE-0045",
      title: "データの暗号化 (保存時・通信時)",
      matchScore: 75 // 75%の確率でこれっぽいというサジェスト
    },
    status: "pending"
  },
  {
        id: 'TASK-0002',
        sourceFile:"B社_2025-03-02_リスクアセスメント.csv",
        rowNumber: 3,
        originalQuestion: "開発環境と本番環境のネットワークは物理的に分離されていますか？",
        suggestedControl: null, // 似ているナレッジが見つからなかったパターン
        status: "pending"
  },
  {
    id: "TASK-003",
    sourceFile: "A社_セキュリティアンケート_2024.csv",
    rowNumber: 22,
    originalQuestion: "退職者のアカウントは速やかに（24時間以内）削除・無効化されますか？",
    suggestedControl: {
      id: "BASE-0018",
      title: "退職者のアカウント削除プロセス",
      matchScore: 92
    },
    status: "pending"
    }
];

export async function GET() {
    return NextResponse.json(mockUnmatchedTasks);
}