import ENV from "@/config/env";
import { initializeApp } from "firebase/app";
import type { Messaging } from "firebase/messaging";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { Capacitor } from '@capacitor/core';

function isLan192(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return /^192\.168(?:\.\d{1,3}){2}$/.test(host);
}

// Disable FCM on native platforms (iOS/Android) since Service Worker is not supported
const isNativePlatform = Capacitor.isNativePlatform();
const DISABLE_FCM = isLan192() || isNativePlatform;

const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY,
  authDomain: ENV.FIREBASE_AUTH_DOMAIN,
  projectId: ENV.FIREBASE_PROJECT_ID,
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.FIREBASE_APP_ID,
  measurementId: ENV.FIREBASE_MEASUREMENT_ID,
};

const app = !DISABLE_FCM ? initializeApp(firebaseConfig) : undefined;
const messaging: Messaging | undefined = !DISABLE_FCM && app ? getMessaging(app) : undefined;

export { app, messaging };

export const requestForToken = async () => {
  if (DISABLE_FCM) {
    console.info("[FCM] Skipped on 192.168.x.x");
    return undefined;
  }

  const permission = await Notification?.requestPermission?.();
  if (permission === "granted") {
    try {
      if (!messaging) return undefined;
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
  return undefined;
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging || DISABLE_FCM) {
      resolve(undefined);
      return;
    }
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
