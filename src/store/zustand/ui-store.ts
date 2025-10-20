import { create } from "zustand";
import { useAuthStore } from "@/store/zustand/auth-store";
import { useToastStore } from "@/store/zustand/toast-store";

export const useUiStore = create<{
    isChatSidebarOpen: boolean;
    openChatSidebar: () => void;
    closeChatSidebar: () => void;
}>((set) => ({
    isChatSidebarOpen: false,
    openChatSidebar: () => set({ isChatSidebarOpen: true }),
    closeChatSidebar: () => set({ isChatSidebarOpen: false }),
}));

export function openSidebarWithAuthCheck() {
    const { isAuthenticated } = useAuthStore.getState();
    const showToast = useToastStore.getState().showToast;
    if (!isAuthenticated) {
        showToast(t("Please login to continue"), 1000, "warning");
        return false;
    }
    useUiStore.getState().openChatSidebar();
    return true;
}