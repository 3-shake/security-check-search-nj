'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useCreateControl } from '../../../hooks/useCreateControl';

function NewControlForm() {
  const { form, updateField, isSaving, handleSave } = useCreateControl();

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
              isSaving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSaving ? '保存中...' : '保存する'}
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
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
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
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
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
              value={form.tagsInput}
              onChange={(e) => updateField('tagsInput', e.target.value)}
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
            value={form.question}
            onChange={(e) => updateField('question', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            確定済み回答 (Answer) <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none h-40"
            placeholder="質問に対する正式な回答を入力してください"
            value={form.answer}
            onChange={(e) => updateField('answer', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default function NewControlPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">読み込み中...</div>}>
      <NewControlForm />
    </Suspense>
  );
}
