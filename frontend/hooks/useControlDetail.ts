import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { SecurityService } from "../gen/proto/security/v1/service_pb";
// ※Controlの型はProtoから生成されたものをそのまま使います
import type { Control } from "../gen/proto/security/v1/service_pb";


export const useControlDetail = (controlId: string | null) => {
    const router = useRouter();
    const [control, setControl] = useState<Control | null>(null);
    const [isEditing, setIsEditing] = useState(false);
  // フォーム用。Protoの型に合わせるため any を許容するか、必要なプロパティだけ定義します
    const [formData, setFormData] = useState<Partial<Control>>({}); 
    const [tagInput, setTagInput] = useState("");
    
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const transport = createConnectTransport({
    baseUrl: "http://localhost:8080",
    
});
const client = createClient(SecurityService, transport);
useEffect(() => {
    const fetchControlDetail = async () => {
        if (!controlId) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await client.getControl({ id: controlId });
            if (res.control) {
                setControl(res.control);
                // フォームデータも初期化
                setFormData(res.control);
                setTagInput(res.control.tags ? res.control.tags.join(",") : "");
            } else {
                throw new Error("コントロールが見つかりません");
            }
        } catch (err) {
            console.error("コントロールの詳細の取得に失敗:", err);
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setIsLoading(false);
        }
    };

    fetchControlDetail();
},[controlId]);

const handleSave = async () => {
    try{
        const res = await client.updateControl({
            id: controlId,
            title: formData.title || "",
            category: formData.category || "",
            question: formData.question || "",
            answer: formData.answer || "",
            tags: tagInput.split(",").map(tag => tag.trim()).filter(tag => tag),
            updatedBy: "currentUserId", // TODO: 現在のユーザーIDをセット
        });

        if (res.control) {
            setControl(res.control);
            setIsEditing(false);
            toast.success("コントロールが更新されました");
        } else {
            throw new Error("コントロールの更新に失敗しました");
        }
    } catch (err) {
        console.error("コントロールの更新に失敗:", err);
        toast.error("コントロールの更新に失敗しました");
    }
};

const handleDelete = async () => {
    if (!window.confirm("本当にこのコントロールを削除しますか？")) return;
    setIsDeleting(true);
    try {
        await client.deleteControl({ id: controlId });
        toast.success("コントロールが削除されました");
        router.push("/controls"); // コントロール一覧にリダイレクト
    } catch (err) {
        console.error("コントロールの削除に失敗:", err);
        toast.error("コントロールの削除に失敗しました");
    } finally {
        setIsDeleting(false);
    }
};

return {
    control,
    isEditing,
    setIsEditing,
    formData,
    setFormData,
    tagInput,
    setTagInput,
    isLoading,
    isDeleting,
    error,
    handleSave,
    handleDelete,
};  
                
            
}; 