import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
const inter = Inter ({subsets : ["latin"]});
export const metadata: Metadata = {
    title: 'セキュリティナレッジ統制管理システム',
    description: 'セキュリティナレッジ統制管理システムのフロントエンドアプリケーションです。',
};



export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ja">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <Toaster position="top-right" />
        <div className="flex h-screen overflow-hidden">
          {/* サイドバー */}
          <aside className="w-64 bg-slate-900 text-white flex flex-col">
            <div className="p-4 text-xl font-bold border-b border-slate-700">
              ナレッジベース 
            </div>
            <nav className="flex-1 p-4 space-y-2">
              <Link href="/" className="block p-2 rounded hover:bg-slate-800">ダッシュボード</Link>
              <Link href="/search" className="block p-2 rounded hover:bg-slate-800">ナレッジ検索</Link>
              <Link href="/controls" className="block p-2 rounded hover:bg-slate-800">Control 一覧</Link>
              <Link href="/unmatched" className="block p-2 rounded hover:bg-slate-800">未マッチ管理</Link>
              <Link href="/upload" className="block p-2 rounded hover:bg-slate-800">CSV取り込み</Link>
              <Link href="/feed" className="block p-2 rounded hover:bg-slate-800">変更フィード</Link>
            </nav>
          </aside>

          {/* メインコンテンツ */}
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
    );
}