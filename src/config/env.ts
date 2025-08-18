/* eslint-disable @typescript-eslint/no-explicit-any */
const ENV = {
  API_URL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
  MODEL: import.meta.env.VITE_MODEL || "default-model",
  BE: import.meta.env.VITE_BE || "https://hihihihahaha.apexbrand.top",
  BE_API_KEY: import.meta.env.VITE_BE_API_KEY || "hihihihahaha",
  GOOGLE_API_KEY: import.meta.env.VITE_GOOGLE_API_KEY || "hihihihahaha",

  FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  FIREBASE_VAPID_KEY: import.meta.env.VITE_FIREBASE_VAPID_KEY,
};

if (typeof window !== "undefined") {
  (window as any).ENV = ENV;
}

export default ENV;
