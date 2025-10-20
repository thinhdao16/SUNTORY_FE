import { useEffect } from "react";
import { useMutation } from "react-query";
import { uploadChatFile } from "@/services/file/file-service";
import { useUploadStore } from "@/store/zustand/upload-store";

export function useUploadChatFile() {
    const setImageLoading = useUploadStore(s => s.setImageLoading);
    const setUploadingFileId = useUploadStore(s => s.setUploadingFileId);

    const mutation = useMutation(uploadChatFile, {
        onMutate: (file: any) => {
            setImageLoading(true);
            setUploadingFileId(file.id);
        },
        onSettled: () => {
            setImageLoading(false);
            setUploadingFileId(undefined);
        },
    });

    return mutation;
}