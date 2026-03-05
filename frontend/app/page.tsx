'use client';
import { useEffect, useState } from 'react';
import { createClient } from "@connectrpc/connect";
import {createConnectTransport} from '@connectrpc/connect-web';
import { SecurityService } from '../gen/proto/security/v1/service_pb';



export default function DashboardPage() {
    const [states,setStates] = useState({totalControls : 0, unmatchedTasks: 0, teamUpdates: 0});
    const [activities, setActivities] = useState<any[]>([]);
    const transport = createConnectTransport({
        baseUrl: 'http://localhost:8080',
    });
    const client = createClient(SecurityService , transport);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await client.getDashboardStats({});
                setStates({
                    totalControls: res.totalControls,
                    unmatchedTasks: res.pendingUnmatched ,
                    teamUpdates:  res.teamUpdates,
                });
                const feedRes = await client.listFeedEvents({});
                setActivities(feedRes.events);
            } catch (error) {
                console.error('Failed to fetch dashboard stats', error);
            }
        };
        fetchStats();
    }, []);
    return (
        <div className="space-y-6">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      {/* 統計パネル */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">登録済み Control 数</h3>
          <p className="text-3xl font-bold mt-2">{states.totalControls}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">未マッチ質問 (要対応)</h3>
          <p className="text-3xl font-bold mt-2 text-red-600">{states.unmatchedTasks}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">今週のチーム更新</h3>
          <p className="text-3xl font-bold mt-2 text-blue-600">{states.teamUpdates}</p>
        </div>
      </div>

      {/* 直近のアクティビティ (モック) */}
      <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4">最近の更新</h2>
        <ul className="space-y-3">
            {activities.map((activity, index) => (
                <li key={index} className="border-b pb-2">
                    <p className="font-semibold">
                        {/* プロトコルの定義に合わせてキャメルケースで指定します */}
                        {activity.userName} が {activity.controlTitle} を {activity.eventType} しました。
                    </p>
                    <p className="text-sm text-gray-500">
                        {activity.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {/* ProtoのTimestamp型は、Connect v2では .toDate() でJSのDateに変換できます */}
                        {activity.createdAt ? activity.createdAt.toDate().toLocaleString('ja-JP') : ''}
                    </p>
                </li>
            ))}
            
            {/* データが0件だった場合の親切な表示 */}
            {activities.length === 0 && (
                <p className="text-gray-500">最近のアクティビティはありません。</p>
            )}
        </ul>
    </div>
        
    </div>
    );
}