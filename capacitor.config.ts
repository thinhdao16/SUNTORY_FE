import type { CapacitorConfig } from '@capacitor/cli';
import 'dotenv/config';
const config: CapacitorConfig = {
  appId: 'com.wayjet.app',
  appName: 'WayJet',
  webDir: 'dist',
  server: {
    cleartext: true,
  },
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
