import {useState, useEffect} from 'react';
import { boolean, set } from 'zod';
export type FeedEvent = {
  id: string;
  eventType: 'update' | 'create' | 'map';
  controlId: string;
  userName: string;
  createdAt: string;
  description: string;
  controlTitle: string;
};

export const useFeed = () => {
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [loading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFeed = async () => {
            setIsLoading(true);
            setError(null);
            try{
                const res = await fetch('/api/feed');
                if (!res.ok) {
                    throw new Error('Failed to fetch feed');
                }
                const data = await res.json();
                setFeed(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeed();
    }, []);

    return { feed, loading, error };
};
