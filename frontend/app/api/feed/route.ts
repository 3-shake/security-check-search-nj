import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Connect RPC は「データの取得(GET)」でも POST メソッドでリクエストを送ります
    const response = await fetch(`http://localhost:8080/security.v1.SecurityService/ListFeedEvents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Connect-Protocol-Version': '1',
      },
      body: JSON.stringify({}), // リクエストボディは空でOK
      cache: 'no-store' // 常に最新のフィードを取得する
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[緊急エラー確認] バックエンドからの返答:', errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching feed events:', error);
    return NextResponse.json({ error: 'Failed to fetch feed events' }, { status: 500 });
  }
}