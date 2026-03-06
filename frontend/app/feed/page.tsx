"use client";

import Link from "next/link";
import { useFeed } from "../../hooks/useFeed";
import { timestampDate } from "@bufbuild/protobuf/wkt"; // 追加: Timestamp変換ツール

export default function FeedPage() {
  const { feed, isLoading, error } = useFeed();

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
        <h2 className="font-bold">エラーが発生しました</h2>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">変更フィード</h1>
        <p className="text-gray-600 text-sm">チームメンバーによるナレッジの更新・追加履歴です。</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 text-sm">フィードを読み込んでいます...</p>
          </div>
        ) : feed.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            最近のアクティビティはありません。
          </div>
        ) : (
          <div className="relative border-l-2 border-gray-200 ml-3 space-y-10">
            {feed.map((event) => (
              <div key={event.id} className="relative ml-8">
                {/* アイコン */}
                <span className="absolute flex items-center justify-center w-6 h-6 bg-white rounded-full -left-11 ring-4 ring-white border-2 border-gray-200">
                  <div className={`w-3 h-3 rounded-full ${
                    event.eventType === 'update' ? 'bg-blue-500' :
                    event.eventType === 'create' ? 'bg-green-500' : 'bg-purple-500'
                  }`}></div>
                </span>

                {/* ヘッダー */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-2 gap-2">
                  <h3 className="text-base font-bold text-gray-900">
                    <span className="text-gray-700">{event.userName || 'システム'}</span>が 
                    <Link href={`/controls/${event.controlId}`} className="mx-1 text-blue-600 hover:underline hover:bg-blue-50 px-1 rounded transition-colors">
                      {event.controlTitle || '対象のControl'}
                    </Link>
                    を
                    {event.eventType === 'update' ? '更新' : event.eventType === 'create' ? '作成' : '紐付け'}しました
                  </h3>
                  
                  {/* Timestampの変換を適用 */}
                  <time className="text-sm font-medium text-gray-400">
                    {event.createdAt ? timestampDate(event.createdAt).toLocaleString('ja-JP') : ''}
                  </time>
                </div>

                {/* 詳細 */}
                <div className="bg-gray-50 border border-gray-100 rounded p-3 text-sm text-gray-600">
                  {event.description}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}