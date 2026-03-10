"use client";

import { uploadFile } from "./UploadFile";
import toast from "react-hot-toast"; // ★ 追加
import { useRef } from "react";

export function UploadForm(){
    // フォームをリセットするための参照
    const formRef = useRef<HTMLFormElement>(null);

    // ★ 追加: サーバーアクションをラップする関数
    const handleUpload = async (formData: FormData) => {
        const file = formData.get("file") as File;
        
        // ファイルが空の場合のエラーハンドリング
        if (!file || file.size === 0) {
            toast.error("ファイルを選択してください。");
            return;
        }

        // 処理中の「くるくる」トーストを表示
        const toastId = toast.loading("アップロード中...");

        try {
            // 既存のサーバーアクションを実行
            await uploadFile(formData);
            
            // 成功したらトーストを緑のチェックに切り替え
            toast.success(`${file.name} のアップロードが完了しました！`, { id: toastId });
            
            // フォームの選択状態をクリア
            formRef.current?.reset();
        } catch (error) {
            console.error(error);
            // 失敗したらトーストを赤のバツに切り替え
            toast.error("アップロードに失敗しました。", { id: toastId });
        }
    };

    return(
        // ★ 変更: ref を追加し、action にラップした関数を渡す
        <form ref={formRef} action={handleUpload} className="flex flex-col gap-6">
            <div className="group relative">
                <input 
                    type="file" 
                    name="file" 
                    accept=".csv" // ★ おまけ: CSVのみ選択できるように制限
                    className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2.5 file:px-6
                        file:rounded-full file:border-0
                        file:text-sm file:font-bold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                        file:cursor-pointer cursor-pointer
                        transition-all"
                />
            </div>
            
            <button 
                type="submit" 
                className="w-full bg-slate-900 text-white py-3.5 px-4 rounded-xl
                    hover:bg-blue-600 active:scale-[0.98]
                    transition-all duration-200
                    font-bold text-sm shadow-lg shadow-blue-200"
            >
                アップロード
            </button>
        </form>
    );
}