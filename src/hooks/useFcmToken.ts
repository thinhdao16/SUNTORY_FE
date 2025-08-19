import { useEffect } from "react";
import { messaging, requestForToken } from "@/lib/firebase";
import { onMessage } from "firebase/messaging";
import { Warning } from "@/types/warning-type";
import { saveFcmToken } from "@/utils/save-fcm-token";
import { useNotificationStore } from "@/store/zustand/notify-store";

export function useFcmToken(mutate?: (data: { fcmToken: string }) => void) {
    const { addNotification } = useNotificationStore.getState();
    useEffect(() => {
        requestForToken().then(async (token) => {
            if (token) {
                await saveFcmToken(token);
                mutate?.({ fcmToken: token });
            }
        });

        let unsubscribe = () => {};
        if (messaging) {
            unsubscribe = onMessage(messaging, (payload) => {
                console.log("🔥 Received payload22:", payload);

                if (payload.notification) {
                    addNotification({
                        type: "message",
                        title: payload.notification.title || "No title",
                        body: payload.notification.body || "No body",
                    });
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
