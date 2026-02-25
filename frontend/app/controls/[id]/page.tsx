import Link from "next/link";


type ControlDetail = {
  id: string;
  title: string;
  status: string;
  category: string;
  tags: string[];
  currentVersion: string;
  lastUpdated: {
    by: string;
    at: string;
  };
  question: string;
  answer: string;
  history: Array<{
    version: string;
    updatedAt: string;
    updatedBy: string;
    diff: {
      field: string;
      old: string;
      new: string;
    } | null;
  }>;
};

export default async function ControlsDetailPage({ params }: { params: Promise<{ id: string }> }) {
 
  const { id } = await params;

  
  const res = await fetch(`http://localhost:3000/api/controls/${id}`, {
    cache: "no-store", // 常に最新を取得する設定
  });
  const data: ControlDetail = await res.json();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 戻るリンク */}
      <div className="mb-4">
        <Link href="/controls" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
          <span>← Control一覧へ戻る</span>
        </Link>
      </div>

      {/* ヘッダー情報 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-sm font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {data.id}
              </span>
              <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded-full border border-green-200">
                {data.status === "active" ? "Active" : "Inactive"}
              </span>
            </div>
            {/* APIから取得したタイトルを表示 */}
            <h1 className="text-2xl font-bold text-gray-900">{data.title}</h1>
          </div>
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 text-sm font-medium">
            編集する
          </button>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-t pt-4">
          <div><span className="text-gray-400">カテゴリ:</span> {data.category}</div>
          <div><span className="text-gray-400">タグ:</span> {data.tags.join(", ")}</div>
          <div><span className="text-gray-400">現在の版:</span> <span className="font-semibold text-gray-800">{data.currentVersion}</span></div>
          <div><span className="text-gray-400">最終更新:</span> {data.lastUpdated.by} ({new Date(data.lastUpdated.at).toLocaleString('ja-JP')})</div>
        </div>
      </div>

      {/* ナレッジ内容 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-gray-500 mb-2">代表的な質問 (CSVからの抽出)</h3>
          <p className="bg-slate-50 p-3 rounded text-gray-800 border border-slate-100">
            {data.question}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-500 mb-2">確定済み回答 ({data.currentVersion})</h3>
          <p className="bg-blue-50 p-4 rounded text-gray-900 border border-blue-100 leading-relaxed">
            {data.answer}
          </p>
        </div>
      </div>

      {/* 変更履歴・差分 (Diff) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold mb-4 border-b pb-2">変更履歴 (版管理)</h2>
        
        <div className="space-y-4">
          {data.history.map((hist, index) => (
            <div key={hist.version} className={`border-l-2 ${index === 0 ? 'border-blue-500' : 'border-gray-200 mt-4'} pl-4 py-1`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`font-bold ${index === 0 ? 'text-gray-800' : 'text-gray-600'}`}>
                  {/* 一つ前のバージョンがあれば表示 */}
                  {index < data.history.length - 1 ? `${data.history[index + 1].version} → ` : ''}{hist.version} の差分
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(hist.updatedAt).toLocaleDateString('ja-JP')} ({hist.updatedBy})
                </span>
              </div>

              {hist.diff ? (
                <div className="bg-gray-50 p-3 rounded font-mono text-sm overflow-x-auto">
                  <div className="text-red-600 bg-red-50 px-2 py-1 mb-1">
                    - <span className="bg-red-200 line-through">{hist.diff.old}</span>
                  </div>
                  <div className="text-green-700 bg-green-50 px-2 py-1">
                    + <span className="bg-green-200 font-bold">{hist.diff.new}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">差分情報はありません。</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}