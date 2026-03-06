import { NextResponse } from "next/server";

export async function GET() {
    try {
        // バックエンド (Go/Connect) の ListUnmatchedTasks エンドポイントを叩く
        const res = await fetch('http://localhost:8080/security.v1.SecurityService/ListUnmatchedTasks', {
            method: 'POST', // Connect の仕様で POST を使用
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({}), // リクエストボディは空でOK
            cache: 'no-store'
        });

        if (!res.ok) {
            throw new Error(`API request failed with status ${res.status}`);
        }

        const data = await res.json();
        
        // Go 側から返ってくる tasks の配列（空の場合は undefined になることがあるのでフォールバック）
        const tasks = data.tasks || [];

        return NextResponse.json({ tasks });
    } catch (error) {
        console.error('Error fetching unmatched tasks:', error);
        return NextResponse.json({ tasks: [] }, { status: 500 });
    }
}