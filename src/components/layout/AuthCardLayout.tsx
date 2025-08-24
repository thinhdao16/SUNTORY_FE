import React from "react";
import { IonPage, IonContent } from "@ionic/react";

interface AuthCardLayoutProps {
    children: React.ReactNode;
    className?: string;
}

const AuthCardLayout: React.FC<AuthCardLayoutProps> = ({ children, className = "" }) => (
    <IonPage>
        <IonContent fullscreen>
            <div className={`w-full h-screen flex flex-col justify-between p-6 ${className}`}>
                {children}
            </div>
        </IonContent>
    </IonPage>
);

export default AuthCardLayout;