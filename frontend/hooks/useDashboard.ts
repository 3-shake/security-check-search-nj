'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-web';
import { SecurityService } from '../gen/proto/security/v1/service_pb';
import type { FeedEvent } from '../gen/proto/security/v1/service_pb';

// transport/client をモジュール外部で一度だけ作成（毎レンダー再生成を防止）
const transport = createConnectTransport({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
});
const client = createClient(SecurityService, transport);

type DashboardStats = {
  totalControls: number;
  unmatchedTasks: number;
  teamUpdates: number;
};

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalControls: 0,
    unmatchedTasks: 0,
    teamUpdates: 0,
  });
  const [activities, setActivities] = useState<FeedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await client.getDashboardStats({});
        setStats({
          totalControls: res.totalControls,
          unmatchedTasks: res.pendingUnmatched,
          teamUpdates: res.teamUpdates,
        });
        const feedRes = await client.listFeedEvents({});
        setActivities(feedRes.events);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return { stats, activities, isLoading, error };
};
