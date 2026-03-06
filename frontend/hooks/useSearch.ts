import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";

// 型定義
export type SearchResult = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  matchSnippet: string;
  updatedAt: string;
};

export const useSearch = () => {
  const [inputValue, setInputValue] = useState("");
  // 入力遅延用のフック
  const [debouncedQuery] = useDebounce(inputValue, 500);

  const [data, setData] = useState({ total: 0, items: [] as SearchResult[] });
  const [isSearching, setIsSearching] = useState(false);
  
 
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!debouncedQuery) {
      setData({ total: 0, items: [] });
      setIsSearching(false);
      setError(null);
      return;
    }

    const fetchResults = async () => {
      setIsSearching(true);
      setError(null);
      
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (!res.ok) {
          throw new Error("検索に失敗しました");
        }
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error("検索エラー:", err);
        // ★ エラーを Error オブジェクトとして保存します
        if (err instanceof Error) {
          setError(err);
        } else {
          setError(new Error(String(err)));
        }
      } finally {
        setIsSearching(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  // ★ ここで debouncedQuery と error をしっかり返します
  return {
    inputValue,
    setInputValue,
    debouncedQuery,
    data,
    isSearching,
    error,
  };
};
