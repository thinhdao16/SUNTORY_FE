import React from "react";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import "@ionic/react/css/core.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";
import "./styles/variables.css";
import "./styles/tailwind.css";
import Global from "./global";
import AppRoutes from "./routes/AppRoutes";
import useSafeArea from "./hooks/useSafeArea";
import "./config/i18n";
import "./App.css";
import ENV from "@/config/env";
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { GoogleOAuthProvider } from '@react-oauth/google';
setupIonicReact();
const GOOGLE_WEB_CLIENT_ID = ENV.GOOGLE_API_KEY;

if (Capacitor.getPlatform && Capacitor.getPlatform() === 'web') {
  GoogleAuth.initialize({
    clientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
  });
}

const App: React.FC = () => {
  useSafeArea();
  return (
    <GoogleOAuthProvider clientId={GOOGLE_WEB_CLIENT_ID}>
      <IonApp className="ion-light">
        <IonReactRouter>
          <IonRouterOutlet>
            <AppRoutes />
          </IonRouterOutlet>
          <Global />
        </IonReactRouter>
      </IonApp>
    </GoogleOAuthProvider>
  );
};

export default App;
