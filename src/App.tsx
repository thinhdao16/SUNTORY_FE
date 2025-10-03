import React, { useEffect } from "react";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import "@ionic/react/css/core.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";
import "flag-icons/css/flag-icons.min.css";
import "./styles/variables.css";
import "./styles/tailwind.css";
import Global from "./global";
import AppRoutes from "./routes/AppRoutes";
import "./config/i18n";
import "./App.css";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_WEB_CLIENT_ID, initGoogleAuth } from "@/config/google";
import useAppInit from "./hooks/useAppInit";
import { StatusBar, Style } from "@capacitor/status-bar";
import { NotificationList } from "./components/notify/NotificationList";
import { RefreshProvider } from "@/contexts/RefreshContext";
import { ModalProvider } from "@/contexts/ModalContext";

setupIonicReact();
initGoogleAuth();

const App: React.FC = () => {
  useAppInit();

  useEffect(() => {
    StatusBar.setOverlaysWebView({ overlay: true });
    StatusBar.setStyle({ style: Style.Light });
  }, []);
  return (
    <GoogleOAuthProvider clientId={GOOGLE_WEB_CLIENT_ID}>
      <RefreshProvider>
        <ModalProvider>
          <IonApp className="ion-light">
            <IonReactRouter>
              <IonRouterOutlet>
                <AppRoutes />
              </IonRouterOutlet>
                <NotificationList />
              <Global />
            </IonReactRouter>
          </IonApp>
        </ModalProvider>
      </RefreshProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
