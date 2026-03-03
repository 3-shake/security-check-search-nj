import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    
    const { id } = await params;

    try {
        const res = await fetch('http://localhost:8080/security.v1.SecurityService/GetControl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Connect-Protocol-Version': '1',
            },
            body: JSON.stringify({ id: id }),
            cache: 'no-store',
        });

        if (!res.ok) {
            if (res.status === 404) {
                 return NextResponse.json({ error: 'Not Found' }, { status: 404 });
            }
            throw new Error(`Failed to fetch control details: ${res.status}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error(`Error fetching control ${id}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    
    const { id } = await params;

    try {
        const body = await request.json();

        const res = await fetch('http://localhost:8080/security.v1.SecurityService/UpdateControl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Connect-Protocol-Version': '1',
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
            cache: 'no-store',
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('[UpdateControl Error]:', errorText);
            throw new Error(`Failed to update control: ${res.status} ${errorText}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error(`Error updating control ${id}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    
    const { id } = await params;

    try{
    

    const response = await fetch(`http://localhost:8080/security.v1.SecurityService/DeleteControl`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Connect-Protocol-Version': '1',
        },
        body: JSON.stringify({ id }),
        cache: 'no-store',
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Failed to delete control: ' + errorText);
    }
    return NextResponse.json({ success: true });
}catch (error) {
    console.error(`Error deleting control ${id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}}