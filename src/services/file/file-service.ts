import httpClient from "@/config/http-client";
import i18n from "@/config/i18n";
import { useToastStore } from "@/store/zustand/toast-store";

export async function uploadChatFile(file: File | Blob) {
    const formData = new FormData();
    formData.append("Files", file);

    try {
        const res = await httpClient.post("/api/v1/chat/upload-file", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data.data as Array<{ name: string; linkImage: string }>;
    } catch (err: any) {
        const showToast = useToastStore.getState().showToast;
        showToast(
            err?.response?.data?.message || i18n.t("upload_image_failed"),
            3000,
            "error"
        );
        throw err;
    }
}