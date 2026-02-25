import { NextResponse } from "next/server";


const mockControlDetails ={
    id: 'BASE-0001',
    title: '多要素認証の実施',
    category: 'Access Control',
    tags: ['MFA', '認証', '2FA'],
    version: 'v5',
    lastUpdated:{
        by: '山田',
        at: '2025-03-06T14:30:00Z'
    },
    question: '特権IDに対して多要素認証（MFA）を適用していますか？',
    answer: 'はい。特権アカウントを含むすべてのユーザーアカウントに対し、MFAを必須としています。',
    history: [
        {
            version: 'v5',
            updatedAt:"2024-03-05T10:00:00Z",
            updatedBy: '山田',
            
                diff:{
                    field: "answer",
                    old: "SMSによる認証も可としています。",
                    new: "SMSによる認証は廃止しています。",
                }

},
{
            version: 'v4',
            updatedAt:"2024-11-10T15:00:00Z",
            updatedBy: '佐藤',
            diff:null
}
    ]
};

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const  id  = await params;
    const data = { ...mockControlDetails, id : id };
    return NextResponse.json(data);
}