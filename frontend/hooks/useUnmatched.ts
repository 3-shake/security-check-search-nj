import { useState, useEffect } from "react";
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { SecurityService } from "../gen/proto/security/v1/service_pb";
// Protoから生成された本物の型をインポート
import type { UnmatchedTask } from "../gen/proto/security/v1/service_pb";

export const useUnmatched = () => {
  const [tasks, setTasks] = useState<UnmatchedTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Connect RPC クライアントの初期化
        const transport = createConnectTransport({
          baseUrl: "http://localhost:8080",
        });
        const client = createClient(SecurityService, transport);

        // ListUnmatchedTasks APIを直接呼び出す
        const res = await client.listUnmatchedTasks({});
        
        setTasks(res.tasks || []);
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