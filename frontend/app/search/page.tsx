"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";

// APIが返すJSONの型定義
type SearchResult = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  matchSnippet: string;
  updatedAt: string;
};

export default function SearchPage() {
  // ユーザーの入力値を即座に保持するステート
  const [inputValue, setInputValue] = useState("");
  // ユーザーの入力が「500ミリ秒」止まった時だけ更新されるステート (Debounce)
  const [debouncedQuery] = useDebounce(inputValue, 500);

  // 検索結果とローディング状態
  const [data, setData] = useState({ total: 0, items: [] as SearchResult[] });
  const [isSearching, setIsSearching] = useState(false);

  // debouncedQuery が変化した時（＝入力が落ち着いた時）にAPIを叩く
  useEffect(() => {
    if (!debouncedQuery) {
      setData({ total: 0, items: [] });
      setIsSearching(false);
      return;
    }

    const fetchResults = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        const result = await res.json();
        setData(result);
      } catch (error) {
        console.error("検索エラー:", error);
      } finally {
        setIsSearching(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">ナレッジ検索</h1>

      {/* 検索フォーム（formタグを外し、リアルタイム入力に対応） */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="キーワードを入力 (例: 認証, MFA)"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 pr-12"
        />
        {/* 検索中（API通信中）は右端にくるくるスピナーを表示 */}
        {isSearching && (
          <div className="absolute right-4 top-3.5">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* 検索中スケルトン */}
      {debouncedQuery && isSearching && (
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

      {/* 検索結果エリア */}
      {debouncedQuery && !isSearching && (
        <div className="mt-8">
          <p className="text-gray-600 mb-4 font-medium">
            「{debouncedQuery}」の検索結果: {data.total} 件
          </p>

          {data.items.length > 0 ? (
            <div className="space-y-4">
              {data.items.map((item) => (
                <Link href={`/controls/${item.id}`} key={item.id} className="block bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {item.id}
                      </span>
                      <h2 className="text-lg font-bold text-blue-700 group-hover:underline">{item.title}</h2>
                    </div>
                    <span className="text-xs text-gray-500">
                      更新: {new Date(item.updatedAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                    {item.matchSnippet}
                  </p>
                  <div className="flex gap-2 text-xs font-medium">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                      {item.category}
                    </span>
                    {item.tags.map(tag => (
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