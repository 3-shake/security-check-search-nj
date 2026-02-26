import Link from "next/link";

export default async function ControlsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // 1. params を await して、id を文字列として取り出す
  const { id: controlId } = await params;

  // 2. データの取得（現時点では取得するだけで、画面はモックのままです）
  const res = await fetch(`http://localhost:3000/api/controls/${controlId}`, {
    cache: "no-store",
  });
  // const data = await res.json();

  // 3. 画面の描画（オブジェクトではなく、文字列の controlId を描画する）
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
                {controlId} {/* ← ここに文字列が入ります */}
              </span>
              <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded-full border border-green-200">
                Active
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">多要素認証の実施</h1>
          </div>
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 text-sm font-medium">
            編集する
          </button>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-t pt-4">
          <div><span className="text-gray-400">カテゴリ:</span> Access Control</div>
          <div><span className="text-gray-400">タグ:</span> MFA, 認証, 2FA</div>
          <div><span className="text-gray-400">現在の版:</span> <span className="font-semibold text-gray-800">v5</span></div>
          <div><span className="text-gray-400">最終更新:</span> 山田 (2025-03-06 14:30)</div>
        </div>
      </div>

      {/* ナレッジ内容 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-gray-500 mb-2">代表的な質問 (CSVからの抽出)</h3>
          <p className="bg-slate-50 p-3 rounded text-gray-800 border border-slate-100">
            特権IDに対して多要素認証（MFA）を適用していますか？
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-500 mb-2">確定済み回答 (v5)</h3>
          <p className="bg-blue-50 p-4 rounded text-gray-900 border border-blue-100 leading-relaxed">
            はい。特権アカウントを含むすべてのユーザーアカウントに対し、MFAを必須としています。認証にはTOTP（RFC 6238）準拠のアプリを使用し、SMSによる認証は廃止しています。
          </p>
        </div>
      </div>
    </div>
  );
}