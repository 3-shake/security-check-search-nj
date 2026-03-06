"use client"; // ← ブラウザで動かすための宣言

import Link from "next/link";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
// APIから返ってくるデータの型定義
type Control = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  version: string;
  status: string;
  question: string;
  answer: string;
};

export default function ControlsDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
  // Next.js 15の仕様に合わせ、paramsをuse()で展開
  const { id: controlId } = use(params);

  // 状態（State）の管理
  const [control, setControl] = useState<Control | null>(null); // DBのデータ
  const [isEditing, setIsEditing] = useState(false);            // 編集モードかどうか
  const [formData, setFormData] = useState<Partial<Control>>({}); // フォームの入力内容
  const [isLoading, setIsLoading] = useState(true);
  const [tagInput, setTagInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. 初回マウント時にDBから本物のデータを取得 (GET)
  useEffect(() => {
    const fetchControl = async () => {
      try {
        const res = await fetch(`/api/controls/${controlId}`);
        if (!res.ok) throw new Error("データの取得に失敗しました");
        const data = await res.json();
        // GoのAPIは { control: {...} } という形で返してきます
        setControl(data.control);
        setFormData(data.control);
        setTagInput(data.control.tags ? data.control.tags.join(", ") : ""); 
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchControl();
  }, [controlId]);

  // 2. 保存ボタンを押したときの処理 (PUT)
  const handleSave = async () => {
    try {
      const res = await fetch(`/api/controls/${controlId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          question: formData.question,
          answer: formData.answer,
          tags: tagInput.split(",").map(t => t.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error("更新に失敗しました");

      const updatedData = await res.json();
      setControl(updatedData.control); // 画面のデータを最新化
      setIsEditing(false); // 閲覧モードに戻す
      toast.success("更新が完了しました！ (バージョンが上がりました)");
    } catch (error) {
      console.error(error);
      alert("エラーが発生しました");
    }
  };
  const handleDelete = async () => {
    if (!window.confirm("本当にこのControlを削除しますか？この操作は取り消せません。")) {
      return;
    }

    setIsDeleting(true);
    try {
      const { id } = await params;
      const res = await fetch(`/api/controls/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("削除に失敗しました");

      toast.success("削除しました。");
      router.push("/controls"); // 削除後は一覧画面へ戻る
      router.refresh(); // 最新の一覧を取得
    } catch (error) {
      console.error(error);
      toast.error("エラーが発生しました。");
      setIsDeleting(false);
    }
  };

  // 読み込み中・エラー時の表示
  if (isLoading) return <div className="text-center mt-10 text-gray-500">読み込み中...</div>;
  if (!control) return <div className="text-center mt-10 text-red-500">データが見つかりません</div>;

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

          {/* 編集・保存ボタンの切り替え */}
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
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 text-sm font-medium transition-colors box-border"
              >
                編集する
              </button>
              
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                
                className="bg-red-500 border border-transparent text-white px-4 py-2 rounded shadow-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 text-sm box-border"
              >
                {isDeleting ? "削除中..." : "削除する"}
              </button>
            </div>
          )}
        </div>

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

      {/* ナレッジ内容 */}
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