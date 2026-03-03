// frontend/app/feed/page.tsx
import Link from "next/link";

// APIが返すJSONの型定義
type FeedEvent = {
  id: string;
  eventType: 'update' | 'create' | 'map';
  controlId: string;
  userName: string;
  createdAt: string;
  description: string;
  controlTitle: string;
};

export default async function FeedPage() {
  // APIからフィード（活動履歴）を取得
  const res = await fetch('http://localhost:3000/api/feed', {
    cache: "no-store",
  });

  const data = await res.json();
  const feed: FeedEvent[] = data.events || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">変更フィード</h1>
        <p className="text-gray-600 text-sm">チームメンバーによるナレッジの更新・追加履歴です。</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
        {/* タイムラインUI (Tailwindのborder-lを使って縦線を引く) */}
        <div className="relative border-l-2 border-gray-200 ml-3 space-y-10">
          
          {feed.map((event) => (
            <div key={event.id} className="relative ml-8">
              {/* イベント種別ごとの丸いアイコン */}
              <span className="absolute flex items-center justify-center w-6 h-6 bg-white rounded-full -left-11 ring-4 ring-white border-2 border-gray-200">
                <div className={`w-3 h-3 rounded-full ${
                  event.eventType === 'update' ? 'bg-blue-500' :
                  event.eventType === 'create' ? 'bg-green-500' : 'bg-purple-500'
                }`}></div>
              </span>

              {/* ヘッダー部分（誰が、いつ、何をしたか） */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-2 gap-2">
                <h3 className="text-base font-bold text-gray-900">
                  <span className="text-gray-700">{event.userName || 'システム'}</span>が 
                  <Link href={`/controls/${event.controlId}`} className="mx-1 text-blue-600 hover:underline hover:bg-blue-50 px-1 rounded transition-colors">
                    {event.controlTitle || '対象のControl'}
                  </Link>
                  を
                  {event.eventType === 'update' ? '更新' : event.eventType === 'create' ? '作成' : '紐付け'}しました
                </h3>
                <time className="text-sm font-medium text-gray-400">
                  {new Date(event.createdAt).toLocaleString('ja-JP')}
                </time>
              </div>

              {/* 詳細テキスト */}
              <div className="bg-gray-50 border border-gray-100 rounded p-3 text-sm text-gray-600">
                {event.description}
              </div>
              
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}