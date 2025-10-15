import { create } from "zustand";

export type NotificationType = "chat_message"
    | "friend_request"
    | "reaction"
    | "friend_request_accepted"
    | "group_chat_created"
    | "group_chat_updated"
    | "group_members_added"
    | "group_members_removed"
    | "member_added_to_group"
    | "group_chat_removed"
    | "liked_post"
    | "commented_post"
    | "reposted_post"
    | "comment_liked_post"
    | "reply_comment_post";

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    createdAt: number;
    isRead?: boolean;
    avatar?: string;
    data?: any;
    isAutoClear?: boolean;
    fullData?: any,
}

interface NotificationState {
    notifications: Notification[];
    lastNotificationTime: number;
    lastActionTime: number;
    isUnReadNotification: boolean;
    addNotification: (n: Omit<Notification, "createdAt">) => void;
    markAsRead: (id: string) => void;
    clearAll: () => void;
    clearOne: (id: string) => void;
    triggerRefresh: () => void;
    setIsUnReadNotification: (isUnReadNotification: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    lastNotificationTime: 0,
    lastActionTime: 0,
    isUnReadNotification: false,
    addNotification: (n) =>
        set((state) => {
            const now = Date.now();

            const uniqueKey = `${n.type}-${n.title}-${n.body}-${JSON.stringify(n.data || {})}`;

            const isDuplicate = state.notifications.some(notification => {
                const existingKey = `${notification.type}-${notification.title}-${notification.body}-${JSON.stringify(notification.data || {})}`;
                const timeDiff = now - notification.createdAt;
                return existingKey === uniqueKey && timeDiff < 5000;
            });

            if (isDuplicate) {
                return state;
            }

            // Chỉ giữ 1 notification, xóa tất cả notification cũ
            return {
                notifications: [
                    {
                        ...n,
                        createdAt: now,
                        data: n.data || {},
                    }
                ],
                lastNotificationTime: now,
                isUnReadNotification: n.type === "chat_message"
                    || n.type   === "reaction"
                    || n.type == "group_chat_created"
                    || n.type === "group_chat_updated"
                    || n.type === "group_members_added"
                    || n.type === "group_members_removed"
                    || n.type === "member_added_to_group"
                    || n.type === "group_chat_removed" ? false : true,
            };
        }),
    triggerRefresh: () =>
        set(() => ({
            lastActionTime: Date.now(),
        })),
    markAsRead: (id) =>
        set((state) => ({
            notifications: state.notifications.map((item) =>
                item.id === id ? { ...item, isRead: true } : item
            ),
        })),
    clearAll: () => set({ notifications: [] }),
    clearOne: (id: string) =>
        set((state) => ({
            notifications: state.notifications.filter((item) => item.id !== id)
        })),
    setIsUnReadNotification: (isUnReadNotification) => set({ isUnReadNotification }),
}));