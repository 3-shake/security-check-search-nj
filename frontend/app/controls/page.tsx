import Link from "next/link";
type Control = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  version: string;
  updatedAt: string;
  author: string;
  status: string;
};
export default async function ControlsPage() {
    const res = await fetch("http://localhost:3000/api/controls", { cache: 'no-store' });
    const data = await res.json();
    const controls: Control[] = data.controls;

    const formatData = (dataString: string) => {
      const d = new Date(dataString);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
  return(<div className="space-y-6 max-w-7xl mx-auto">
      {/* ヘッダー部分 */}
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Control 一覧</h1>
          <p className="text-gray-600">登録されているすべてのセキュリティナレッジを管理します。</p>
        </div>
        <div>
          <Link 
            href="/controls/new" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>+ 新規Control作成</span>
          </Link>
        </div>
      </div>

      {/* フィルター・検索バー (モック) */}
      <div className="flex gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <select className="border border-gray-300 rounded px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>すべてのカテゴリ</option>
          <option>Access Control</option>
          <option>Network Security</option>
          <option>Endpoint Security</option>
        </select>
        <input 
          type="text" 
          placeholder="Control IDやタイトルで絞り込み..." 
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Control テーブル */}
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
            {controls.map((control) => (
              <tr key={control.id} className="hover:bg-blue-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {control.id}
                    </span>
                    {control.status === 'draft' && (
                      <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded border border-yellow-200">下書き</span>
                    )}
                  </div>
                  <div className="font-medium text-gray-900">{control.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                  {control.category}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {control.tags.map(tag => (
                      <span key={tag} className="bg-blue-50 text-blue-700 border border-blue-100 text-xs px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                    {control.version}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  <div>{control.updatedAt}</div>
                  <div className="text-xs text-gray-400">{control.author}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <Link href={`/controls/${control.id}`} className="text-blue-600 hover:text-blue-900 font-medium hover:underline text-sm">
                    詳細を見る
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>);
}