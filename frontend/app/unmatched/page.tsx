"use client";

import Link from "next/link";
// ★ 先ほど作ったカスタムフックをインポート
import { useUnmatched } from "../../hooks/useUnmatched";

export default function UnmatchedPage() {
  // ★ fetchの代わりにフックを呼び出すだけ！超スッキリ！
  const { tasks, isLoading, error } = useUnmatched();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">未マッチ（新規質問）管理</h1>
          <p className="text-gray-600">
            アップロードされたチェックシートの中で、過去のナレッジと一致しなかった質問の一覧です。
          </p>
        </div>
      </div>

      {/* エラー時の表示を追加 */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg">
          <p className="font-bold text-sm">エラーが発生しました: {error.message}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : tasks.length === 0 && !error ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center text-gray-500">
          現在、未回答の新しい質問はありません。
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                <th className="p-4 font-semibold w-1/4">ファイル名 (行番号)</th>
                <th className="p-4 font-semibold w-1/2">質問内容</th>
                <th className="p-4 font-semibold w-1/4">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-blue-50 transition-colors group">
                  <td className="p-4 text-sm text-gray-700">
                    <span className="block font-medium truncate" title={task.originalFileName}>
                      {task.originalFileName}
                    </span>
                    <span className="text-xs text-gray-500">行: {task.rowNumber}</span>
                  </td>
                  <td className="p-4 text-sm text-gray-900 font-medium">
                    {task.questionText}
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/controls/new?question=${encodeURIComponent(task.questionText)}&taskId=${task.id}`}
                      className="inline-block px-4 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded hover:bg-blue-200 transition-colors"
                    >
                      回答を作成する
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}