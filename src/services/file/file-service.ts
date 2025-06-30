import httpClient from "@/config/http-client";

export async function uploadChatFile(file: File | Blob) {
    const formData = new FormData();
    formData.append("Files", file);

    const res = await httpClient.post("/api/v1/chat/upload-file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data as Array<{ name: string; linkImage: string }>;
}