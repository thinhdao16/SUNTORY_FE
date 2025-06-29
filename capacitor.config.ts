import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wayjet.app',
  appName: 'WayJet',
  webDir: 'dist',
  server: {
    // url: "http://192.168.1.32:5173",
    url: "https://ment-optimize-anywhere-expert.trycloudflare.com",
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
      serverClientId: '544649939857-endt7v6abdo4fpca87ihhoq1qr5ij8jf.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
