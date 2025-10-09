// useNativePush.ts
import { useEffect } from "react";
import { Capacitor, PluginListenerHandle } from "@capacitor/core";
import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
} from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { saveFcmToken } from "@/utils/save-fcm-token";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { useUpdateNewDevice } from "@/hooks/device/useDevice";
import useDeviceInfo from "@/hooks/useDeviceInfo";

const ANDROID_CHANNEL_ID = "messages_v2"; 

export function useNativePush(mutate?: (data: { fcmToken: string }) => void) {
  const updateNewDevice = useUpdateNewDevice();
  const deviceInfo = useDeviceInfo();

  useEffect(() => {
    console.log("🔥 Using native push notifications - platform", Capacitor.isNativePlatform());

    if (!Capacitor.isNativePlatform()) return;

    (async () => {
      if (Capacitor.getPlatform() === "ios") {
        console.log("native push notifications", Capacitor.isNativePlatform());

        try {
          await (PushNotifications as any).setPresentationOptions?.({
            alert: true,
            sound: true,
            badge: true,
          });
        } catch {}
      }

      const pushPerm = await PushNotifications.requestPermissions();
      console.log("Push permissions", pushPerm);
      if (pushPerm.receive === "granted") {
        await PushNotifications.register();
      } else {
        console.warn("Push permission not granted");
      }

      const localPerm = await LocalNotifications.requestPermissions();
      console.log("Local permissions", localPerm);
      if (localPerm.display !== "granted") {
        console.warn("LocalNotifications permission not granted");
      }

      if (Capacitor.getPlatform() === "android") {
        try {
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
        } catch (e) {
          console.warn("createChannel error", e);
        }
      }
    })();

    let regHandle: PluginListenerHandle | undefined;
    let regErrHandle: PluginListenerHandle | undefined;
    let recvHandle: PluginListenerHandle | undefined;
    let actHandle: PluginListenerHandle | undefined;

    (async () => {
      console.log("🔥 Using native push notifications - event");

      const { token } = await FirebaseMessaging.getToken();
      console.log("🔥 Using native push notifications - token", token);

      // Update device with new FCM token
      if (deviceInfo.deviceId) {
        console.log("🔥 Using native push notifications save ", deviceInfo.deviceId, token);
        updateNewDevice.mutate({
          deviceId: deviceInfo.deviceId,
          firebaseToken: token,
        });
      }

      regHandle = await PushNotifications.addListener("registration", async (token: Token) => {
        console.log("✅ Registered token:", token.value);
        await saveFcmToken(token.value);

        // Update device with new FCM token
        if (deviceInfo.deviceId) {
          console.log("🔥 Using native push notifications registered ", deviceInfo.deviceId, token);
          updateNewDevice.mutate({
            deviceId: deviceInfo.deviceId,
            firebaseToken: token.value,
          });
        }

        mutate?.({ fcmToken: token.value });
      });

      regErrHandle = await PushNotifications.addListener("registrationError", (err) => {
        console.error("❌ Registration error:", err);
      });

      recvHandle = await PushNotifications.addListener(
        "pushNotificationReceived",
        async (n: PushNotificationSchema) => {
          console.log("✅ Received push notification:", n);

          try {
            if (Capacitor.getPlatform() === "android") {
              await LocalNotifications.schedule({
                notifications: [{
                    id: Date.now() % 2147483647,
                    title: n.title || "WayJet",
                    body: n.body || "",
                    channelId: ANDROID_CHANNEL_ID,
                    smallIcon: "ic_stat_name",     
                    sound: "default",
                    extra: n.data || {},
                    schedule: { at: new Date(Date.now() + 50) },
                  },
                ],
              });
            } else if (Capacitor.getPlatform() === "ios") {
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
        }
      );
    })();

    return () => {
      regHandle?.remove();
      regErrHandle?.remove();
      recvHandle?.remove();
      actHandle?.remove();
    };
  }, [deviceInfo.deviceId]);
}

