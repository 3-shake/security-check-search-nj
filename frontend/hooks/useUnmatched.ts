import { useState, useEffect } from "react";

// 型定義
export type UnmatchedTask = {
  id: string;
  originalFileName: string;
  rowNumber: number;
  questionText: string;
  status: string;
};

export const useUnmatched = () => {
  const [tasks, setTasks] = useState<UnmatchedTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const res = await fetch("/api/unmatched");
        if (!res.ok) {
          throw new Error("未マッチタスクの取得に失敗しました");
        }
        const data = await res.json();
        setTasks(data.tasks || []);
      } catch (err) {
        console.error("Failed to fetch unmatched tasks", err);
        if (err instanceof Error) {
          setError(err);
        } else {
          setError(new Error(String(err)));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  return { tasks, isLoading, error };
};