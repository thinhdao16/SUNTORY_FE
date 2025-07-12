import type { CapacitorConfig } from '@capacitor/cli';
import 'dotenv/config';
import { KeyboardResize } from '@capacitor/keyboard';

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
      splashFullScreen: false,
      splashImmersive: false,
      useDialog: false
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: process.env.VITE_GOOGLE_API_KEY || "",
      forceCodeForRefreshToken: true,
    },
    Keyboard: {
      resize: KeyboardResize.Body,       // hoặc Ionic nếu bạn cần ion-app resize
      resizeOnFullScreen: true,          // Bắt buộc để hỗ trợ scroll khi fullscreen
    },
    EdgeToEdge: {
      backgroundColor: "#ffffff",
    },
  },
  android: {
    adjustMarginsForEdgeToEdge: "force"
  }
};

export default config;