// frontend/app/search/page.tsx
import Link from "next/link";

// APIが返すJSONの型定義
type SearchResult = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  matchSnippet: string;
  updatedAt: string;
};


export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // URLの ?q=xxx からキーワードを取得
  const { q } = await searchParams;
  const query = q || "";

  // APIから検索結果を取得 (キーワードがある時だけ検索する)
  let data = { query: "", total: 0, items: [] as SearchResult[] };
  
  if (query) {
    const res = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}`, {
      cache: "no-store",
    });
    data = await res.json();
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">ナレッジ検索</h1>

      {/* 検索フォーム */}
      <form method="GET" action="/search" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="キーワードを入力 (例: 認証, MFA)"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        />
        <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-sm transition-colors">
          検索
        </button>
      </form>

      {/* 検索結果エリア */}
      {query && (
        <div className="mt-8">
          <p className="text-gray-600 mb-4 font-medium">
            「{query}」の検索結果: {data.total} 件
          </p>

          {data.items.length > 0 ? (
            <div className="space-y-4">
              {data.items.map((item) => (
                // カード全体をリンクにして、詳細画面へ飛べるようにする
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