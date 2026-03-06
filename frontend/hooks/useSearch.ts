import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { SecurityService } from "../gen/proto/security/v1/service_pb";

import type { Control } from "../gen/proto/security/v1/service_pb";

export const useSearch = () => {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery] = useDebounce(inputValue, 500);

  const [data, setData] = useState({ total: 0, controls: [] as Control[] });
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!debouncedQuery) {
      setData({ total: 0, controls: [] });
      setIsSearching(false);
      setError(null);
      return;
    }

    const fetchResults = async () => {
      setIsSearching(true);
      setError(null);
      
      try {
        // Connect RPC クライアントの初期化
        const transport = createConnectTransport({
          baseUrl: "http://localhost:8080",
        });
        const client = createClient(SecurityService, transport);

        // searchControls APIを直接呼び出す
        const res = await client.searchControls({ query: debouncedQuery });
        const fetchedHits = res.hits || [];
        setData({
          total: fetchedHits.length || 0,
          controls: fetchedHits || [],
        });
      } catch (err) {
        console.error("検索エラー:", err);
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

  return {
    inputValue,
    setInputValue,
    debouncedQuery,
    data,
    isSearching,
    error,
  };
};
