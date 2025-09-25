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
| "comment_liked_post";

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
}

interface NotificationState {
    notifications: Notification[];
    addNotification: (n: Omit<Notification, "createdAt">) => void;
    markAsRead: (id: string) => void;
    clearAll: () => void;
    clearOne: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    addNotification: (n) =>
        set((state) => ({
            notifications: [
                {
                    ...n,
                    createdAt: Date.now(),
                    data: n.data || {},
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
    clearOne: (id: string) =>
        set((state) => ({
            notifications: state.notifications.filter((item) => item.id !== id),
        })),
}));
