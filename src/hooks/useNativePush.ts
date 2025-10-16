import { useEffect, useRef } from "react";
import { Capacitor, PluginListenerHandle } from "@capacitor/core";
import { App } from "@capacitor/app";
import {
  PushNotifications,
  PushNotificationSchema,
  ActionPerformed,
  Token,
} from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Preferences } from '@capacitor/preferences'; 
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { saveFcmToken } from "@/utils/save-fcm-token";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useHistory } from "react-router-dom";
import { NotificationType, isChatNotification, isStoryNotification } from "@/types/notification";
import { useUpdateNewDevice } from "./device/useDevice";

const ANDROID_CHANNEL_ID = "messages_v2";


export function useNativePush(mutate?: (data: { fcmToken: string }) => void) {
  const updateNewDevice = useUpdateNewDevice();
  const deviceInfo = useDeviceInfo();
  const history = useHistory();
  const appActiveRef = useRef<boolean>(true);
  const lastSeenRef = useRef<Map<string, number>>(new Map());
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
    let regErrHandle: PluginListenerHandle | undefined;
    let recvHandle: PluginListenerHandle | undefined;
    let fmMsgHandle: PluginListenerHandle | undefined;
    let appStateHandle: PluginListenerHandle | undefined;
    let actHandle: PluginListenerHandle | undefined;
    try {
      (async () => {
        try {
          const st = await App.getState();
          appActiveRef.current = !!st.isActive;
        } catch {}
        try {
          appStateHandle = await App.addListener("appStateChange", ({ isActive }) => {
            appActiveRef.current = !!isActive;
          });
        } catch {}
      })();
    } catch {}

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
      } catch { }

      fmMsgHandle = await FirebaseMessaging.addListener(
        "notificationReceived",
        async (msg: any) => {
          const title = msg?.notification?.title || msg?.data?.title || "WayJet";
          const body = msg?.notification?.body || msg?.data?.body || "";
          const data = msg?.data || {};

          if (platform === "android" && appActiveRef.current) {
            const dedupKey = `${title}|${body}|${JSON.stringify(data || {})}`;
            const nowTs = Date.now();
            const lastTs = lastSeenRef.current.get(dedupKey);
            if (lastTs && nowTs - lastTs < 8000) {
              console.log("Skip Wduplicate notification", { dedupKey });
              return;
            }
            lastSeenRef.current.set(dedupKey, nowTs);
            for (const [k, v] of lastSeenRef.current) {
              if (nowTs - v > 60000) lastSeenRef.current.delete(k);
            }
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

      regHandle = await PushNotifications.addListener(
        "registration",
        async (token: Token) => {
          console.log("✅ Registered token:", token.value);
          await saveFcmToken(token.value);

          if (deviceInfo.deviceId) {
            console.log(
              "🔥 Using native push notifications registered ",
              deviceInfo.deviceId,
              token
            );
            updateNewDevice.mutate({
              deviceId: deviceInfo.deviceId,
              firebaseToken: token.value,
            });
          }

          mutate?.({ fcmToken: token.value });
        }
      );

      regErrHandle = await PushNotifications.addListener(
        "registrationError",
        (err: any) => {
          console.warn("Push registration error:", err);
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
        async (action: ActionPerformed) => {
          const data = action.notification.data;
          let route = "";
          console.log("data", data)

          if (isChatNotification(data.type)) {
            route = `/social-chat/t/${data.chat_code}`;
            // history.push(`/social-chat/t/${data.chat_code}`);
          }
          else if (isStoryNotification(data.type)) {
            // history.push(`/social-feed/f/${data.post_code}`);
            route = `/social-feed/f/${data.post_code}`;
          }
          else if (data.type === NotificationType.FRIEND_REQUEST) {
            route = `/profile/${data.from_user_id}`;
            // history.push(`/profile/${data.from_user_id}`);
          }
          else if (data.type === NotificationType.FRIEND_REQUEST_ACCEPTED) {
            route = `/profile/${data.accepter_user_id}`;
            // history.push(`/profile/${data.accepter_user_id}`);
          }
          if (route) {
            await Preferences.set({ key: "pendingRoute", value: route });
            history.push(route);
          }
        }
      );  
    })();

    return () => {
      regHandle?.remove();
      regErrHandle?.remove();
      recvHandle?.remove();
      actHandle?.remove();
      fmMsgHandle?.remove();
      appStateHandle?.remove();
    };
  }, [deviceInfo.deviceId]);
}