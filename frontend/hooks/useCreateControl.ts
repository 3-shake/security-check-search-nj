import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { SecurityService } from "../gen/proto/security/v1/service_pb";

type CreateControlForm = {
  title: string;
  category: string;
  tagsInput: string;
  question: string;
  answer: string;
};

export const useCreateControl = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState<CreateControlForm>({
    title: '',
    category: '',
    tagsInput: '',
    question: '',
    answer: '',
  });
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // URLパラメータから初期値を読み取り（未マッチタスクからの遷移対応）
  useEffect(() => {
    const q = searchParams.get('question');
    const t = searchParams.get('taskId');
    if (q) setForm((prev) => ({ ...prev, question: decodeURIComponent(q) }));
    if (t) setTaskId(t);
  }, [searchParams]);

  // フォームフィールド更新
  const updateField = <K extends keyof CreateControlForm>(field: K, value: CreateControlForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // バリデーション
  const validate = (): boolean => {
    if (!form.title || !form.category || !form.question || !form.answer) {
      toast.error('タイトル、カテゴリ、質問、回答は必須です。');
      return false;
    }
    return true;
  };

  // 保存処理
  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    const tagsArray = form.tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag !== '');

    try {
      // Connect RPC クライアントの初期化
      const transport = createConnectTransport({
        baseUrl: 'http://localhost:8080',
      });
      const client = createClient(SecurityService, transport);

      // 直接バックエンドの createControl を呼び出す
      await client.createControl({
        title: form.title,
        category: form.category,
        tags: tagsArray,
        question: form.question,
        answer: form.answer,
        // Protocol Buffersのstring型はnullを許容しないことが多いので、空文字を渡します
        unmatchedTaskId: taskId || "", 
      });

      toast.success('新しいControlを作成しました！');
      router.push('/controls');
    } catch (err) {
      console.error(err);
      toast.error('コントロールの保存中にエラーが発生しました。');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    form,
    updateField,
    isSaving,
    handleSave,
  };
};