import { useState, useEffect } from 'react';
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { SecurityService } from "../gen/proto/security/v1/service_pb";
// Protoから自動生成された型をインポート
import type { FeedEvent } from "../gen/proto/security/v1/service_pb";

export const useFeed = () => {
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFeed = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Connect RPC クライアントの初期化
        const transport = createConnectTransport({
          baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
        });
        const client = createClient(SecurityService, transport);

        // 直接バックエンドの関数を呼び出す！
        const res = await client.listFeedEvents({});
        
        setFeed(res.events || []);
      } catch (err) {
        if (err instanceof Error) {
          setError(err);
        } else {
          setError(new Error(String(err)));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeed();
  }, []);

  return { feed, isLoading, error };
};
