"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ca, fi } from "zod/v4/locales";

export default function NewControlPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [tagsInput, setTagsInput] = useState("");
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    

  const handleSave = async () => {
    if (!title || !category || !question || !answer) {
      alert("タイトル、カテゴリ、質問、回答は必須です。");
      return;
    }

    setIsSaving(true);
    const tagsArray = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "");
try {      const res = await fetch("/api/controls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          tags: tagsArray,
          question,
          answer,
        }),
        });
        if (!res.ok) {
          throw new Error("Failed to save control");
        }
        router.push("/controls");
      } catch (error) {
        console.error(error);
        alert("コントロールの保存中にエラーが発生しました。");
      } finally {
        setIsSaving(false);
      }
    router.push("/controls");
    };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">新規Controlの作成</h1>
          <p className="text-gray-600">新しいセキュリティナレッジを登録します。</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/controls"
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors font-medium"
          >
            キャンセル
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors font-medium ${
              isSaving ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSaving ? "保存中..." : "保存する"}
          </button>
        </div>
      </div>

      {/* 入力フォーム */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="例: AWS IAMユーザーのMFA強制"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              カテゴリ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="例: Access Control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              タグ (カンマ区切り)
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="例: AWS, IAM, MFA"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            代表質問 (Question) <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none h-24"
            placeholder="チェックシートでよく聞かれる質問を入力してください"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            確定済み回答 (Answer) <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none h-40"
            placeholder="質問に対する正式な回答を入力してください"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
