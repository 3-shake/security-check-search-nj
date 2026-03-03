import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('http://localhost:8080/security.v1.SecurityService/ListControls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Connect-Protocol-Version': '1',
      },
      body: JSON.stringify({}),
      cache: 'no-store',
    });

    if (!res.ok) {
      // ↓↓↓ ここが超重要！Goからのエラーテキストを読み取ってログに出します ↓↓↓
      const errorText = await res.text();
      console.error('[緊急エラー確認] バックエンドからの返答:', errorText);
      throw new Error(`API request failed with status ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    
    return NextResponse.json({
      controls: data.controls || [],
      totalCount: data.controls?.length || 0
    });
  } catch (error) {
    console.error('Error fetching controls:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const  id = await params.id;
    try {
        const body = await request.json();
        const response = await fetch(`http://localhost:8080/security.v1.SecurityService/UpdateControl`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: id,
                title: body.title,
                category: body.category,
                question: body.question,
                answer: body.answer,
                tags: body.tags || [],
                updated_by: "system"
            }),
            cache: 'no-store'
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[緊急エラー確認] バックエンドからの返答:', errorText);
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error updating control:', error);
        return NextResponse.json({ error: 'Failed to update control' }, { status: 500 });
    }
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Goバックエンドの CreateControl メソッドを呼び出す
    const response = await fetch(`http://localhost:8080/security.v1.SecurityService/CreateControl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Connect-Protocol-Version': '1',
      },
      body: JSON.stringify({
        title: body.title,
        category: body.category,
        question: body.question,
        answer: body.answer,
        tags: body.tags || [],
        // created_by や updated_by はバックエンド側で処理される想定
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[緊急エラー確認] バックエンドからの返答:', errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating control:', error);
    return NextResponse.json({ error: 'Failed to create control' }, { status: 500 });
  }
}