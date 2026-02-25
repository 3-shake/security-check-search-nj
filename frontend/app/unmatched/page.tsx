// frontend/app/unmatched/page.tsx
import Link from "next/link";

// APIが返すJSONの型定義
type UnmatchedTask = {
  id: string;
  sourceFile: string;
  rowNumber: number;
  originalQuestion: string;
  suggestedControl: {
    id: string;
    title: string;
    matchScore: number;
  } | null;
  status: string;
};

export default async function UnmatchedPage() {
  // APIから未マッチタスクのリストを取得
  const res = await fetch('http://localhost:3000/api/unmatched', {
    cache: "no-store",
  });
  const tasks: UnmatchedTask[] = await res.json();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">未マッチ管理 (要対応タスク)</h1>
        <p className="text-gray-600 text-sm">
          取り込んだCSVの中で、既存のナレッジと自動で紐付かなかった質問のリストです。手動でマッピングするか、新しいナレッジとして登録してください。
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <span className="font-bold text-gray-700">残りタスク: {tasks.length} 件</span>
        </div>

        <ul className="divide-y divide-gray-200">
          {tasks.map((task) => (
            <li key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* 左側：元の質問情報 */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-yellow-100 text-yellow-800 font-bold px-2 py-1 rounded">
                      {task.id}
                    </span>
                    <span>ファイル: {task.sourceFile} (行: {task.rowNumber})</span>
                  </div>
                  <div className="bg-gray-100 p-3 rounded border border-gray-200 text-gray-800 font-medium">
                    {task.originalQuestion}
                  </div>
                </div>

                {/* 右側：サジェストとアクション */}
                <div className="flex-1 flex flex-col justify-center space-y-3 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6">
                  {task.suggestedControl ? (
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-1">AIのサジェスト候補 (類似度: {task.suggestedControl.matchScore}%)</p>
                      <Link href={`/controls/${task.suggestedControl.id}`} className="block bg-blue-50 border border-blue-100 p-2 rounded text-sm text-blue-700 hover:underline mb-2">
                        {task.suggestedControl.id} : {task.suggestedControl.title}
                      </Link>
                      <div className="flex gap-2">
                        <button className="flex-1 bg-white border border-blue-600 text-blue-600 text-sm font-bold py-1.5 rounded hover:bg-blue-50">
                          これに紐付ける
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-1">サジェスト候補</p>
                      <p className="text-sm text-gray-500 italic mb-3">類似するナレッジが見つかりませんでした。</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button className="flex-1 bg-gray-800 text-white text-sm font-bold py-1.5 rounded hover:bg-gray-700">
                      新規Control作成
                    </button>
                    <button className="flex-1 bg-white border border-gray-300 text-gray-700 text-sm font-bold py-1.5 rounded hover:bg-gray-50">
                      手動検索
                    </button>
                  </div>
                </div>

              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}