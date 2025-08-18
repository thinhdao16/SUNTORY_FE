import ENV from "@/config/env";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY,
  authDomain: ENV.FIREBASE_AUTH_DOMAIN,
  projectId: ENV.FIREBASE_PROJECT_ID,
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.FIREBASE_APP_ID,
  measurementId: ENV.FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { app, messaging };

export const requestForToken = async () => {
  const permission = await Notification?.requestPermission();
  if (permission === "granted") {
    try {
      const token = await getToken(messaging, {
        vapidKey: ENV.FIREBASE_VAPID_KEY,
      });
      return token;
    } catch (error) {
      console.error("Failed to get FCM token:", error);
    }
  } else if (permission === "denied") {
    console.log("You denied the notification permission");
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
