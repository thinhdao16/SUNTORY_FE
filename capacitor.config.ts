import type { CapacitorConfig } from '@capacitor/cli';
import 'dotenv/config';
const config: CapacitorConfig = {
  appId: 'com.wayjet.app',
  appName: 'WayJet',
  webDir: 'dist',
  // server: {
  //   // url: "http://192.168.1.32:5173",
  //   url: "https://b24f-113-23-110-26.ngrok-free.app",
  //   cleartext: true,
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: "#0A6EBD",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      splashFullScreen: true,
      splashImmersive: true,
      useDialog: false
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: process.env.VITE_GOOGLE_API_KEY || "",
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
