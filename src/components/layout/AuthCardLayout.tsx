import React from "react";
import { IonPage, IonContent } from "@ionic/react";

interface AuthCardLayoutProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
}

const AuthCardLayout: React.FC<AuthCardLayoutProps> = ({ title, children, className = "" }) => (
    <IonPage>
        <IonContent fullscreen>
            <div className="min-h-screen flex flex-col items-center justify-center p-6"
            >
                {title && (
                    <h1 className="text-3xl font-semibold mb-6 text-main darkk:text-gray-200">
                        {title}
                    </h1>
                )}
                <div className={`w-full ${className}`}>
                    {children}
                </div>
            </div>
        </IonContent>
    </IonPage>
);

export default AuthCardLayout;