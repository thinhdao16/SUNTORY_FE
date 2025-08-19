import { create } from "zustand";

export type NotificationType = "message" | "friend_request" | "reaction";

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    createdAt: number;
    isRead?: boolean;
    avatar?: string;
}

interface NotificationState {
    notifications: Notification[];
    addNotification: (n: Omit<Notification, "id" | "createdAt">) => void;
    markAsRead: (id: string) => void;
    clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    addNotification: (n) =>
        set((state) => ({
            notifications: [
                {
                    id: crypto.randomUUID(),
                    createdAt: Date.now(),
                    ...n,
                },
                ...state.notifications,
            ],
        })),
    markAsRead: (id) =>
        set((state) => ({
            notifications: state.notifications.map((item) =>
                item.id === id ? { ...item, isRead: true } : item
            ),
        })),
    clearAll: () => set({ notifications: [] }),
}));
