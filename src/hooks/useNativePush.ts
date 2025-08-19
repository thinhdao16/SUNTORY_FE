import { useEffect } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { saveFcmToken } from "@/utils/save-fcm-token";
import { useNotificationStore } from "@/store/zustand/notify-store";

export function useNativePush(mutate?: (data: { fcmToken: string }) => void) {
    const { addNotification } = useNotificationStore.getState();

    useEffect(() => {
        PushNotifications.requestPermissions().then((result) => {
            if (result.receive === "granted") {
                PushNotifications.register();
            } else {
                console.warn("Push permission not granted");
            }
        });

        PushNotifications.addListener("registration", async (token) => {
            console.log("✅ Registered token:", token.value);
            await saveFcmToken(token.value);
            mutate?.({ fcmToken: token.value });
        });

        PushNotifications.addListener("registrationError", (err) => {
            console.error("❌ Registration error:", err);
        });

        PushNotifications.addListener("pushNotificationReceived", (notification) => {
            console.log("🔥 Notification received:", notification);
            if (notification) {
                addNotification({
                    type: "message",
                    title: notification.title || "No title",
                    body: notification.body || "No body",
                });
            }
        });

        PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
            console.log("➡️ User tapped notification:", notification);
        });

    }, [mutate]);
}
