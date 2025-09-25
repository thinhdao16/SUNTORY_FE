import { useEffect } from "react";
import { messaging, requestForToken } from "@/lib/firebase";
import { onMessage } from "firebase/messaging";
import { Warning } from "@/types/warning-type";
import { saveFcmToken } from "@/utils/save-fcm-token";
import { NotificationType, useNotificationStore } from "@/store/zustand/notify-store";

export function useFcmToken(mutate?: (data: { fcmToken: string }) => void) {
    const { addNotification, clearOne } = useNotificationStore.getState();
    useEffect(() => {
        requestForToken().then(async (token) => {
            if (token) {
                await saveFcmToken(token);
                mutate?.({ fcmToken: token });
            }
        });

        let unsubscribe = () => { };
        if (messaging) {
            unsubscribe = onMessage(messaging, (payload) => {
                var id = crypto.randomUUID();
                if (payload.notification) {
                    addNotification({
                        id: id,
                        type: payload?.data?.type.toLowerCase() as NotificationType || "chat_message",
                        title: payload.notification.title || "No title",
                        body: payload.notification.body || "No body",
                        avatar: payload?.data?.image_icon || "/favicon.png",
                        data: payload.data || {},
                    });
                    if (Notification.permission === "granted") {
                        const title = payload.notification.title || "Thông báo";
                        const body = payload.notification.body || "";
                        new Notification(title, {
                            body,
                            icon: "/favicon.png",
                            data: payload.data || {},
                            requireInteraction: false,
                            silent: false
                        });
                    }
                    setTimeout(() => clearOne(id), 4000);
                }

                if (payload.data?.data) {
                    try {
                        const warning = JSON.parse(payload.data.data) as Warning;
                        console.log("🔥 Parsed warning:", warning);
                    } catch (e) {
                        console.error("❌ Failed to parse warning:", e);
                    }
                }
            });
        }

        return () => unsubscribe();
    }, [mutate]);
}
