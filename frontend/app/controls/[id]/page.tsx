"use client";

import Link from "next/link";
import { use } from "react";
import { useControlDetail } from "../../../hooks/useControlDetail";

export default function ControlsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15の仕様に合わせ、paramsをuse()で展開してIDを取得
  const { id: controlId } = use(params);

  // カスタムフックから必要な状態と関数をすべて受け取る
  const {
    control,
    isEditing,
    setIsEditing,
    formData,
    setFormData,
    tagInput,
    setTagInput,
    isLoading,
    isDeleting,
    error,
    handleSave,
    handleDelete,
  } = useControlDetail(controlId);

  // 読み込み中・エラー時の表示
  if (isLoading) return (
    <div className="flex justify-center mt-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
  if (error) return <div className="text-center mt-10 text-red-500 font-bold">{error.message}</div>;
  if (!control) return <div className="text-center mt-10 text-gray-500">データが見つかりません</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* 戻るリンク */}
      <div className="mb-4">
        <Link href="/controls" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
          <span>← Control一覧へ戻る</span>
        </Link>
      </div>

      {/* ヘッダー情報 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-sm font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {control.id}
              </span>
              <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded-full border border-green-200">
                Active
              </span>
            </div>
            
            {/* タイトルの表示/編集 */}
            {isEditing ? (
              <input 
                type="text" 
                value={formData.title || ""} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full text-2xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none pb-1"
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">{control.title}</h1>
            )}
          </div>

          {/* 編集・保存・削除ボタン */}
          {isEditing ? (
            <div className="flex gap-2">
              <button 
                onClick={() => { setIsEditing(false); setFormData(control); }} 
                className="text-gray-600 px-4 py-2 text-sm font-medium hover:bg-gray-50 rounded transition-colors"
              >
                キャンセル
              </button>
              <button 
                onClick={handleSave} 
                className="bg-blue-600 text-white px-4 py-2 rounded shadow-sm hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                保存する
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => { setIsEditing(true); setTagInput(control.tags ? control.tags.join(", ") : ""); }}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                編集する
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-500 border border-transparent text-white px-4 py-2 rounded shadow-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
              >
                {isDeleting ? "削除中..." : "削除する"}
              </button>
            </div>
          )}
        </div>

        {/* メタ情報 (カテゴリ、タグ、バージョン) */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-t pt-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">カテゴリ:</span>
            {isEditing ? (
              <input type="text" value={formData.category || ""} onChange={(e) => setFormData({...formData, category: e.target.value})} className="border border-gray-300 rounded px-2 py-1" />
            ) : (
              <span>{control.category}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">タグ:</span>
            {isEditing ? (
                <input 
                type="text" 
                value={tagInput} 
                onChange={(e) => setTagInput(e.target.value)} 
                placeholder="カンマ区切り" 
                className="border border-gray-300 rounded px-2 py-1 w-64" 
              />
            ) : (
              <span>{control.tags?.join(", ") || "なし"}</span>
            )}
          </div>
          <div><span className="text-gray-400">現在の版:</span> <span className="font-semibold text-gray-800">v{control.version}</span></div>
        </div>
      </div>

      {/* ナレッジ内容 (代表質問と回答) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-gray-500 mb-2">代表的な質問 (CSVからの抽出)</h3>
          {isEditing ? (
            <textarea 
              value={formData.question || ""} 
              onChange={(e) => setFormData({...formData, question: e.target.value})}
              className="w-full bg-slate-50 p-3 rounded text-gray-800 border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              rows={2}
            />
          ) : (
            <p className="bg-slate-50 p-3 rounded text-gray-800 border border-slate-100">
              {control.question}
            </p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-500 mb-2">確定済み回答 (v{control.version})</h3>
          {isEditing ? (
            <textarea 
              value={formData.answer || ""} 
              onChange={(e) => setFormData({...formData, answer: e.target.value})}
              className="w-full bg-blue-50 p-4 rounded text-gray-900 border border-blue-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none leading-relaxed"
              rows={6}
            />
          ) : (
            <p className="bg-blue-50 p-4 rounded text-gray-900 border border-blue-100 leading-relaxed whitespace-pre-wrap">
              {control.answer}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}