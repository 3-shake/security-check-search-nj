import { useState, useEffect } from 'react';

// API Route (/api/feed) が返す JSON の型定義
export type FeedEventJSON = {
  id: number;
  eventType: string;
  controlId: string;
  userName: string;
  createdAt: string;
  description: string;
  controlTitle: string;
};

export const useFeed = () => {
  const [feed, setFeed] = useState<FeedEventJSON[]>([]);
  const [loading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeed = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/feed');
        if (!res.ok) {
          throw new Error('Failed to fetch feed');
        }
        const data = await res.json();
        setFeed(data.events ?? []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeed();
  }, []);

  return { feed, loading, error };
};
