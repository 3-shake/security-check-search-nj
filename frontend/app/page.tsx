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

  // ② ローディング時のUI（スケルトン）
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />

        {/* 統計パネル スケルトン */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="h-9 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* アクティビティ スケルトン */}
        <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
          <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border-b pb-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ③ データ取得成功時のUI
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
