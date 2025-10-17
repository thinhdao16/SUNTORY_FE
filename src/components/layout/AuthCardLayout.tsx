import React from "react";
import { IonPage, IonContent } from "@ionic/react";

interface AuthCardLayoutProps {
    children: React.ReactNode;
    className?: string;
}

const AuthCardLayout: React.FC<AuthCardLayoutProps> = ({ children, className = "" }) => (
    <IonPage style={{paddingTop: "var(--safe-area-inset-top, 0px)",}}>
        <IonContent fullscreen>
            <div className={`w-full  flex flex-col justify-between p-6 ${className}`}
            style={{height: "calc("+window.innerHeight+"px - var(--safe-area-inset-top, 0px))"}}
            >
                {children}
            </div>
        </IonContent>
    </IonPage>
);

export default AuthCardLayout;