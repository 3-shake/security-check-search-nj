"use client";

import Link from "next/link";
import { useControlList } from "../../hooks/useControlList";
import { timestampDate } from "@bufbuild/protobuf/wkt";

export default function ControlsListPage() {
  // フックからは実データに関するものだけを受け取る
  const { controls, isLoading, error } = useControlList();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ヘッダー部分 */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">ナレッジ (Control) 一覧</h1>
          <p className="text-gray-600">登録されているすべてのセキュリティチェック項目と回答のベースです。</p>
        </div>
        <Link 
          href="/controls/new" 
          className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
        >
          <span>＋ 新規作成</span>
        </Link>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg">
          <p className="font-bold text-sm">エラーが発生しました: {error.message}</p>
        </div>
      )}

      {/* メインコンテンツ（ローディング or 空状態 or 一覧） */}
      {isLoading ? (
        /* ローディング（スケルトン） */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-gray-600">ID / タイトル</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-gray-600">カテゴリ</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-gray-600">タグ</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-gray-600">版</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-gray-600">最終更新</th>
                <th scope="col" className="px-6 py-3 text-center font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {[...Array(6)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <div className="h-5 w-14 bg-gray-200 rounded-full animate-pulse" />
                      <div className="h-5 w-14 bg-gray-200 rounded-full animate-pulse" />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-5 w-10 bg-gray-200 rounded-full animate-pulse" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : controls.length === 0 && !error ? (
        /* 空状態 */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          登録されているナレッジがありません。
        </div>
      ) : (
        /* データ一覧 */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                <th className="p-4 font-semibold w-24">ID</th>
                <th className="p-4 font-semibold">タイトル / カテゴリ</th>
                <th className="p-4 font-semibold hidden md:table-cell">代表的な質問</th>
                <th className="p-4 font-semibold w-32">更新日</th>
                <th className="p-4 font-semibold w-24 text-center">詳細</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {controls.map((control) => (
                <tr key={control.id} className="hover:bg-blue-50 transition-colors group">
                  <td className="p-4 text-sm font-mono text-gray-600">{control.id}</td>
                  <td className="p-4">
                    <div className="font-bold text-gray-900 mb-1">{control.title}</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {/* whitespace-nowrap を付けて、単語の途中で縦に改行されるのを防ぐ */}
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200 whitespace-nowrap">
                        {control.category}
                      </span>
                      {control.tags?.map(tag => (
                        <span key={tag} className="text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 whitespace-nowrap">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600 hidden md:table-cell">
                    <p className="line-clamp-2">{control.question || control.answer}</p>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {/* Timestamp型の変換 */}
                    {control.updatedAt ? timestampDate(control.updatedAt).toLocaleDateString('ja-JP') : ''}
                  </td>
                  <td className="p-4 text-center">
                    <Link 
                      href={`/controls/${control.id}`}
                      className="inline-block text-blue-600 font-medium text-sm hover:underline px-3 py-1 bg-blue-50 rounded group-hover:bg-blue-100 transition-colors"
                    >
                      開く
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
