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
import "./config/i18n";
import "./App.css";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_WEB_CLIENT_ID, initGoogleAuth } from "@/config/google";
import useAppInit from "./hooks/useAppInit";
setupIonicReact();
initGoogleAuth();

const App: React.FC = () => {
  useAppInit();
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
