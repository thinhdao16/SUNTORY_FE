import { useEffect } from "react";
import { Capacitor, PluginListenerHandle } from "@capacitor/core";
import {
  PushNotifications,
  PushNotificationSchema,
  ActionPerformed,
} from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { saveFcmToken } from "@/utils/save-fcm-token";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useHistory } from "react-router-dom";
import { NotificationType, isChatNotification, isStoryNotification } from "@/types/notification";

const ANDROID_CHANNEL_ID = "messages_v2";

export function useNativePush(mutate?: (data: { fcmToken: string }) => void) {
  const deviceInfo = useDeviceInfo();
  const history = useHistory();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const platform = Capacitor.getPlatform();

    (async () => {
      try {
        if (platform === "android") {
          const localPerm = await LocalNotifications.requestPermissions();
          console.log("Local permissions", localPerm);
          if (localPerm.display !== "granted") {
            console.warn("LocalNotifications permission not granted");
          }

          await LocalNotifications.createChannel({
            id: ANDROID_CHANNEL_ID,
            name: "Messages",
            description: "Message notifications",
            importance: 5,
            visibility: 1,
            sound: "default",
            vibration: true,
            lights: true,
          });
        } 
        else if (platform === "ios") {
          const pushPerm = await PushNotifications.requestPermissions();
          if (pushPerm.receive === "granted") {
            await PushNotifications.register();
          }
        }
      } catch (err) {
        console.warn("Push init error:", err);
      }
    })();

    let regHandle: PluginListenerHandle | undefined;
    let recvHandle: PluginListenerHandle | undefined;
    let fmMsgHandle: PluginListenerHandle | undefined;
    let actHandle: PluginListenerHandle | undefined;

    (async () => {
      try {
        const permStatus = await FirebaseMessaging.checkPermissions();
        if (permStatus?.receive === "granted") {
          const { token } = await FirebaseMessaging.getToken();
          if (deviceInfo.deviceId && token) {
            await saveFcmToken(token);
            mutate?.({ fcmToken: token });
          }
        }
      } catch {}

      fmMsgHandle = await FirebaseMessaging.addListener(
        "notificationReceived",
        async (msg: any) => {
          const title = msg?.notification?.title || msg?.data?.title || "WayJet";
          const body = msg?.notification?.body || msg?.data?.body || "";
          const data = msg?.data || {};

          if (platform === "android") {
            try {
              await LocalNotifications.schedule({
                notifications: [
                  {
                    id: Date.now() % 2147483647,
                    title,
                    body,
                    channelId: ANDROID_CHANNEL_ID,
                    sound: "default",
                    smallIcon: "ic_launcher",
                    extra: data,
                  },
                ],
              });
            } catch (e) {
              console.warn("LocalNotifications.schedule (Firebase) error", e);
            }
          }
        }
      );

      recvHandle = await PushNotifications.addListener(
        "pushNotificationReceived",
        async (n: PushNotificationSchema) => {
          const title = n.title || "WayJet";
          const body = n.body || "";
          const data = n.data || {};

          try {
            if (platform === "android") {
              await LocalNotifications.schedule({
                notifications: [
                  {
                    id: Date.now() % 2147483647,
                    title,
                    body,
                    channelId: ANDROID_CHANNEL_ID,
                    sound: "default",
                    smallIcon: "ic_launcher",
                    extra: data,
                  },
                ],
              });
            } 
            else if (platform === "ios") {
              await LocalNotifications.schedule({
               notifications: [{
                 id: Date.now() % 2147483647,
                 title: n.title || "WayJet",
                 body: n.body || "",
                 sound: "default",
                 schedule: { at: new Date(Date.now() + 50) },
               }],
              });
            }
          } catch (e) {
            console.warn("LocalNotifications.schedule error", e);
          }
        }
      );

      actHandle = await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (action: ActionPerformed) => {
          console.log("➡️ Tapped:", action);

          const data = action.notification.data;

          if (isChatNotification(data.type)) {
            history.push(`/social-chat/t/${data.chat_code}`);
          }
          else if (isStoryNotification(data.type)) {
            history.push(`/social-feed/f/${data.post_code}`);
          }
          else if (data.type === NotificationType.FRIEND_REQUEST) {
            history.push(`/profile/${data.from_user_id}`);
          }
          else if (data.type === NotificationType.FRIEND_REQUEST_ACCEPTED) {
            history.push(`/profile/${data.accepter_user_id}`);
          }
        }
      );
    })();

    return () => {
      regHandle?.remove();
      recvHandle?.remove();
      fmMsgHandle?.remove();
      actHandle?.remove();
    };
  }, [deviceInfo.deviceId, mutate]);
}
