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
        const hits = data.hits || [];
        return NextResponse.json({
            query: query,
            total: hits.length,
            items: hits
        });
    } catch (error) {
        console.error('Error fetching search results:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
    
}
    