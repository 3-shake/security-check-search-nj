"use client";

import Link from "next/link";
import { useSearch } from "../../hooks/useSearch";
import { timestampDate } from "@bufbuild/protobuf/wkt";

export default function SearchPage() {
  const { 
    inputValue, 
    setInputValue, 
    debouncedQuery, 
    data, 
    isSearching, 
    error 
  } = useSearch();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">ナレッジ検索</h1>

      {/* 検索フォーム */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="キーワードを入力 (例: 認証, MFA)"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 pr-12"
        />
        {/* 入力欄内のミニスピナー（検索中であることを入力欄でも視覚的に示す） */}
        {isSearching && (
          <div className="absolute right-4 top-3.5">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg mt-4">
          <p className="font-bold text-sm">検索エラー: {error.message}</p>
        </div>
      )}

      {/* 検索中スケルトン（エラーがない場合のみ表示） */}
      {debouncedQuery && isSearching && !error && (
        <div className="mt-8 space-y-4">
          <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-4" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-14 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 検索結果エリア（検索が完了し、エラーがない場合のみ表示） */}
      {debouncedQuery && !isSearching && !error && (
        <div className="mt-8">
          <p className="text-gray-600 mb-4 font-medium">
            「{debouncedQuery}」の検索結果: {data?.total || 0} 件
          </p>

          {/* items ではなく controls を参照 */}
          {data?.controls && data.controls.length > 0 ? (
            <div className="space-y-4">
              {data.controls.map((item) => (
                <Link 
                  href={`/controls/${item.id}`} 
                  key={item.id} 
                  className="block bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {item.id}
                      </span>
                      <h2 className="text-lg font-bold text-blue-700 group-hover:underline">{item.title}</h2>
                    </div>
                    <span className="text-xs text-gray-500">
                      更新: {item.updatedAt ? timestampDate(item.updatedAt).toLocaleDateString('ja-JP') : ''}
                    </span>
                  </div>
                  
                  {/* スニペットの代わりに質問文または回答を表示 */}
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed line-clamp-2">
                    {item.question || item.answer}
                  </p>

                  <div className="flex gap-2 text-xs font-medium">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                      {item.category}
                    </span>
                    {item.tags?.map(tag => (
                      <span key={tag} className="bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg text-center">
              <p className="text-gray-500">一致するナレッジが見つかりませんでした。</p>
              <p className="text-sm text-gray-400 mt-2">別のキーワード（例: 認証）でお試しください。</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}