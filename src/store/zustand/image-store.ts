import { create } from "zustand";

interface ChatUploadStore {
    pendingImages: string[];
    pendingFiles: { name: string; url: string }[];
    addPendingImages: (imgs: string[]) => void;
    addPendingFiles: (files: { name: string; url: string }[]) => void;
    removePendingImage: (idx: number) => void;
    removePendingFile: (idx: number) => void;
    clearAll: () => void;
}

export const useImageStore = create<ChatUploadStore>((set) => ({
    pendingImages: [],
    pendingFiles: [],
    addPendingImages: (imgs) =>
        set((s) => ({ pendingImages: [...s.pendingImages, ...imgs] })),
    addPendingFiles: (files) =>
        set((s) => ({ pendingFiles: [...s.pendingFiles, ...files] })),
    removePendingImage: (idx) =>
        set((s) => ({
            pendingImages: s.pendingImages.filter((_, i) => i !== idx),
        })),
    removePendingFile: (idx) =>
        set((s) => ({
            pendingFiles: s.pendingFiles.filter((_, i) => i !== idx),
        })),
    clearAll: () => set({ pendingImages: [], pendingFiles: [] }),
}));