import type { CapacitorConfig } from '@capacitor/cli';
import 'dotenv/config';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.wayjet.app',
  appName: 'WayJet',
  webDir: 'dist',
  // server: {
  //   cleartext: true,
  //   url:"http://192.168.1.94:5173"
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
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
    EdgeToEdge: {
      backgroundColor: "#ffffff",
    },
    Media: {
      androidGalleryMode: true
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_notify',    
      iconColor: '#0A6EBD',          
      sound: 'default'               
    },
    ScreenOrientation: {
      orientation: 'portrait'
    }
  },
  android: {
    adjustMarginsForEdgeToEdge: "force",
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  }
};

export default config;