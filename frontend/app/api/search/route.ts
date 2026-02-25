import { NextResponse } from "next/server";
const mockSearchResults = [
    {
        id: 'BASE-0001',
        title: '多要素認証の実施',
        category: 'Access Control',
        tags: ['MFA', '認証', '2FA'],
        matchSnippet: 'はい。特権アカウントを含むすべてのユーザーアカウントに対し、MFAを必須としています。',
        updatedAt: '2025-03-06T14:30:00Z',
    },
    {
        id: 'BASE-0002',
        title: 'パスワードポリシー',
        category: 'Access Control',
        tags: ['パスワード', '認証'],
        matchSnippet: '...最低12文字以上、英大文字・小文字・数字・記号を含む複雑なパスワードを要求...',
        updatedAt: '2025-03-06T14:30:00Z',
    },
    {
        id:"BASE-0128",
        title: 'ゼロトラストアクセス制御',
        category: 'Network Security',
        tags: ['ゼロトラスト', 'VPN', '境界制御'],
        matchSnippet: '...社内外を問わずすべてのアクセスを検査し、最小権限でアクセスを許可するゼロトラストモデルを採用しています。',
        updatedAt: '2025-03-01T09:00:00Z',
    }
];

export async function GET(request:Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    let results = mockSearchResults;
    if (query){
        if (query){
            results = mockSearchResults.filter(control =>
                control.title.includes(query) || control.tags.some(t => t.includes(query)))
            
        }
    }
    return NextResponse.json({
        query: query || "",
        total: results.length,
        items: results
    })
    
}
    