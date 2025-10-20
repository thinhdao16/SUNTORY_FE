// upload-store.ts
import { create } from "zustand";

interface UploadStoreState {
    imageLoading: boolean;
    uploadingFileId?: string;
    setImageLoading: (v: boolean) => void;
    setUploadingFileId: (id?: string) => void;
}

export const useUploadStore = create<UploadStoreState>((set) => ({
    imageLoading: false,
    uploadingFileId: undefined,
    setImageLoading: (loading: boolean) => set({ imageLoading: loading }),
    setUploadingFileId: (id?: string) => set({ uploadingFileId: id }),
}));