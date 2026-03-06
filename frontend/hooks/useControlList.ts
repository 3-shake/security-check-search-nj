import { useState, useEffect } from "react";
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { SecurityService } from "../gen/proto/security/v1/service_pb";
// Protoから生成された本物の Control 型をインポート
import type { Control } from "../gen/proto/security/v1/service_pb";

export const useControlList = () => {
  const [controls, setControls] = useState<Control[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchControls = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Connect RPC クライアントの初期化
        const transport = createConnectTransport({
          baseUrl: "http://localhost:8080",
        });
        const client = createClient(SecurityService, transport);

        // APIを直接呼び出す
        const res = await client.listControls({});
        
        // Protoで定義されている「controls」を受け取る
        setControls(res.controls || []);
      } catch (err) {
        console.error("コントロール一覧取得エラー:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    fetchControls();
  }, []);

  return { controls, isLoading, error };
};
