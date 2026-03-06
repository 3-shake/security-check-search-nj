import { useState, useEffect, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export type Control = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  version: string;
  updatedAt: string;
  updatedBy: string;
  status: string;
};

export const useControlList = () => {
  const [allControls, setAllControls] = useState<Control[]>([]);
  const [filteredControls, setFilteredControls] = useState<Control[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // フィルター状態
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // カテゴリ一覧（データから動的生成）
  const [categories, setCategories] = useState<string[]>([]);

  // 全件取得
  const fetchControls = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/controls');
      if (!res.ok) {
        throw new Error('Control一覧の取得に失敗しました');
      }
      const data = await res.json();
      const controls: Control[] = data.controls ?? [];
      setAllControls(controls);

      // カテゴリ一覧を抽出
      const uniqueCategories = [...new Set(controls.map((c) => c.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 検索API呼び出し（デバウンス付き）
  const searchControls = useDebouncedCallback(async (query: string) => {
    if (!query.trim()) {
      // 検索クエリが空ならフィルターのみ適用
      applyFilter(allControls, '', selectedCategory);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        throw new Error('検索に失敗しました');
      }
      const data = await res.json();
      const hits: Control[] = data.items ?? [];
      applyFilter(hits, query, selectedCategory);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, 300);

  // カテゴリフィルターの適用（クライアントサイド）
  const applyFilter = (controls: Control[], query: string, category: string) => {
    let result = controls;
    if (category) {
      result = result.filter((c) => c.category === category);
    }
    setFilteredControls(result);
  };

  // 検索クエリ変更
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    searchControls(query);
  };

  // カテゴリ変更
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const source = searchQuery.trim() ? filteredControls : allControls;
    // カテゴリ変更時は現在のソースに対して再フィルター
    if (searchQuery.trim()) {
      // 検索中の場合は再検索してからフィルタ
      searchControls(searchQuery);
    } else {
      applyFilter(allControls, '', category);
    }
  };

  // 初回ロード
  useEffect(() => {
    fetchControls();
  }, [fetchControls]);

  // allControls が更新されたら filteredControls にも反映
  useEffect(() => {
    applyFilter(allControls, searchQuery, selectedCategory);
  }, [allControls]);

  // カテゴリが変更されたら再フィルター
  useEffect(() => {
    if (searchQuery.trim()) {
      searchControls(searchQuery);
    } else {
      applyFilter(allControls, '', selectedCategory);
    }
  }, [selectedCategory]);

  return {
    controls: filteredControls,
    isLoading,
    error,
    searchQuery,
    selectedCategory,
    categories,
    handleSearchChange,
    handleCategoryChange,
    refetch: fetchControls,
  };
};
