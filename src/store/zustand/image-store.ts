import { create } from "zustand";

interface ChatUploadStore {
    pendingImages: string[];
    pendingFiles: { name: string; url: string }[];
    addPendingImages: (imgs: string[]) => void;
    addPendingFiles: (files: { name: string; url: string }[]) => void;
    removePendingImage: (idx: number) => void;
    removePendingImageByUrl: (url: string) => void;
    replacePendingImage: (oldUrl: string, newUrl: string) => void;
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
    removePendingImageByUrl: (url) =>
        set((s) => ({
            pendingImages: s.pendingImages.filter((img) => img !== url),
        })),
    replacePendingImage: (oldUrl, newUrl) =>
        set((s) => ({
            pendingImages: s.pendingImages.map((img) => (img === oldUrl ? newUrl : img)),
        })),
    removePendingFile: (idx) =>
        set((s) => ({
            pendingFiles: s.pendingFiles.filter((_, i) => i !== idx),
        })),
    clearAll: () => set({ pendingImages: [], pendingFiles: [] }),
}));