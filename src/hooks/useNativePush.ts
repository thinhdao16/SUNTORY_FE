import { useEffect, useRef } from "react";
import { Capacitor, PluginListenerHandle } from "@capacitor/core";
import { App } from "@capacitor/app";
import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
} from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { saveFcmToken } from "@/utils/save-fcm-token";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useUpdateNewDevice } from "@/hooks/device/useDevice";

const ANDROID_CHANNEL_ID = "messages_v2";

export function useNativePush(mutate?: (data: { fcmToken: string }) => void) {
  const updateNewDevice = useUpdateNewDevice();
  const deviceInfo = useDeviceInfo();
  const appActiveRef = useRef<boolean>(true);
  const lastSeenRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const platform = Capacitor.getPlatform();

    (async () => {
      try {
        if (platform === "ios") {
          await (PushNotifications as any).setPresentationOptions?.({
            alert: true,
            sound: true,
            badge: true,
          });
        }

        const pushPerm = await PushNotifications.requestPermissions();
        if (pushPerm.receive === "granted") {
          await PushNotifications.register();
        }

        await LocalNotifications.requestPermissions();

        if (platform === "android") {
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
      } catch {}

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
              console.log("Skip duplicate notification", { dedupKey });
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
        (n: PushNotificationSchema) => {
          console.log("➡️ Received:", n);
        }
      );

      actHandle = await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (action: ActionPerformed) => {
          console.log("➡️ Tapped:", action);
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
