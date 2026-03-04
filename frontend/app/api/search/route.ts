import { NextResponse } from "next/server";

export async function GET(request:Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    try {
        const res = await fetch('http://localhost:8080/security.v1.SecurityService/SearchControls', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query }),
            cache: 'no-store'
        });

        if (!res.ok) {
            throw new Error(`API request failed with status ${res.status}`);
        }

        const data = await res.json();
        
        // ★ Connect (Go) から返ってくるレスポンスの hits は、空の場合 undefined になることがある
        // そこで、undefined の場合は [] (空配列) をフォールバックとして使う
        const hits = data.hits || [];

        return NextResponse.json({
            query: query,
            total: hits.length,
            items: hits // ← これで items が必ず配列（最低でも空配列）になる
        });
    } catch (error) {
        console.error('Error fetching search results:', error);
        // ★ エラー時もフロントエンドが落ちないように、空の items を返す
        return NextResponse.json({ 
            query: query,
            total: 0, 
            items: [] 
        }, { status: 500 });
    }
}
    