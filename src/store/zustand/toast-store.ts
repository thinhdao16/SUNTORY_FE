import { create } from "zustand";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastState {
  message: string | null;
  duration: number;
  isOpen: boolean;
  type: ToastType;
  showToast: (message: string, duration?: number, type?: ToastType) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  duration: 2000,
  isOpen: false,
  type: "info",
  showToast: (message, duration = 2000, type = "info") =>
    set({ message, duration, isOpen: true, type }),
  hideToast: () => set({ isOpen: false, message: null }),
}));
