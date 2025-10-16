import { useEffect } from "react";
import { Capacitor, PluginListenerHandle } from "@capacitor/core";
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
import { useHistory } from "react-router";
const ANDROID_CHANNEL_ID = "messages_v2";


export function useNativePush(mutate?: (data: { fcmToken: string }) => void) {
  const deviceInfo = useDeviceInfo();
  const history = useHistory();

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
          // Tạo channel với cấu hình tối ưu để tránh mất thông báo
          await LocalNotifications.createChannel({
            id: ANDROID_CHANNEL_ID,
            name: "Messages",
            description: "Message notifications",
            importance: 5, // HIGH importance
            visibility: 1, // PUBLIC
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
      } catch { }

      fmMsgHandle = await FirebaseMessaging.addListener(
        "notificationReceived",
        async (msg: any) => {
          const title = msg?.notification?.title || msg?.data?.title || "WayJet";
          const body = msg?.notification?.body || msg?.data?.body || "";
          const data = msg?.data || {};
          console.log("notificationReceived", msg);
          console.log("msg", msg);
          
          // Hiển thị local notification với cấu hình tối ưu
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
                    ongoing: false, // Không phải notification liên tục
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
          console.log("pushNotificationReceived", n);

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
                    ongoing: false, // Không phải notification liên tục
                  },
                ],
              });
            } catch (e) {
              console.warn("LocalNotifications.schedule error", e);
            }
          }
        }
      );

      actHandle = await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (action: ActionPerformed) => {
          const data = action.notification?.data;
          console.log("pushNotificationActionPerformed", data);

          // Navigate based on notification type
          // if (data?.type) {
          //   switch (data.type) {
          //     case 'message':
          //       history.push('/messages');
          //       break;
          //     case 'order':
          //       history.push('/orders');
          //       break;
          //     case 'promotion':
          //       history.push('/promotions');
          //       break;
          //     case 'profile':
          //       history.push('/profile');
          //       break;
          //     default:
          //       // Default navigation hoặc không navigate
          //       console.log('Unknown notification type:', data.type);
          //       break;
          //   }
          // }

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
