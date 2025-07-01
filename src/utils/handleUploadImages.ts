import { UseMutationResult } from "react-query";

export async function handleUploadImages(
    files: FileList | File[],
    uploadImageMutation: UseMutationResult<any, unknown, File | Blob>,
    showToast: (msg: string, duration?: number, type?: string) => void,
    t: (key: string) => string,
    maxCount = 3,
    maxSize = 5 * 1024 * 1024
): Promise<string[]> {
    const arrFiles = Array.from(files);
    if (arrFiles.length > maxCount) {
        showToast(t("You can only send up to 3 images and files in total!"), 2000, "warning");
        return [];
    }
    const localUrls = arrFiles.map(file => URL.createObjectURL(file));
    const uploadResults = await Promise.all(arrFiles.map(file => {
        if (file.size > maxSize) {
            showToast(t("Ảnh phải nhỏ hơn 5MB!"), 3000, "warning");
            return null;
        }
        return uploadImageMutation.mutateAsync(file).catch(() => null);
    }));
    const serverLinks = uploadResults
        .map((uploaded, idx) => {
            URL.revokeObjectURL(localUrls[idx]);
            if (uploaded && uploaded.length > 0) {
                return uploaded[0].linkImage;
            }
            return null;
        })
        .filter(Boolean) as string[];
    return serverLinks;
}