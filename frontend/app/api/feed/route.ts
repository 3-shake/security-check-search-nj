import { NextResponse } from "next/server";

const mockFeedEvents = [
    {
    id: "EVT-001",
    type: "update", // 更新
    controlId: "BASE-0001",
    controlTitle: "多要素認証の実施",
    user: "山田",
    timestamp: "2024-03-06T14:30:00Z",
    details: "v4からv5へ更新しました（SMS認証の廃止を反映）"
    },
    {
    id: "EVT-002",
    type: "create", // 新規作成
    controlId: "BASE-0128",
    controlTitle: "ゼロトラストアクセス制御",
    user: "佐藤",
    timestamp: "2024-03-05T09:15:00Z",
    details: "新規Controlを作成しました"
  },
  {
    id: "EVT-003",
    type: "map", // マッピング（紐付け）
    controlId: "BASE-0045",
    controlTitle: "データの暗号化 (保存時・通信時)",
    user: "鈴木",
    timestamp: "2024-03-04T16:45:00Z",
    details: "「A社_セキュリティアンケート_2024.csv」の未マッチ質問をこのControlに紐付けました"
  }
];

export async function GET() {
    return NextResponse.json(mockFeedEvents);
}