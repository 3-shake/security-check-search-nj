'use client';
import { useDashboard } from '../hooks/useDashboard';
import { timestampDate } from '@bufbuild/protobuf/wkt';

export default function DashboardPage() {
  const { stats, activities, isLoading, error } = useDashboard();

  // ① エラー時のUI
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg">
        <h2 className="font-bold">データの取得に失敗しました</h2>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  // ② ローディング時のUI（スピナーを表示）
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">ダッシュボードを読み込んでいます...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      {/* 統計パネル */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">登録済み Control 数</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalControls}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">未マッチ質問 (要対応)</h3>
          <p className="text-3xl font-bold mt-2 text-red-600">{stats.unmatchedTasks}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">今週のチーム更新</h3>
          <p className="text-3xl font-bold mt-2 text-blue-600">{stats.teamUpdates}</p>
        </div>
      </div>

      {/* 直近のアクティビティ */}
      <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4">最近の更新</h2>
        <ul className="space-y-3">
          {activities.map((activity) => (
            <li key={activity.id} className="border-b pb-2">
              <p className="font-semibold">
                {activity.userName} が {activity.controlTitle} を {activity.eventType} しました。
              </p>
              <p className="text-sm text-gray-500">
                {activity.description}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {activity.createdAt
                  ? timestampDate(activity.createdAt).toLocaleString('ja-JP')
                  : ''}
              </p>
            </li>
          ))}

          {activities.length === 0 && (
            <p className="text-gray-500">最近のアクティビティはありません。</p>
          )}
        </ul>
      </div>
    </div>
  );
}
