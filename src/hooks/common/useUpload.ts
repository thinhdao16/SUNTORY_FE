import { useMutation } from "react-query";
import { uploadChatFile } from "@/services/file/file-service";

export function useUpload() {
    return useMutation(uploadChatFile);
}