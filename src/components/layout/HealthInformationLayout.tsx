import React from "react";
import { IonPage, IonContent } from "@ionic/react";
import HealthInformationHeaderProgress from "@/components/header/HealthInformationHeaderProgress";
import ActionHealInformation from "../button/ActionHealInformation";

interface HealthInformationLayoutProps {
    onStepClick?: (idx: number) => void;
    onBack?: () => void;
    onSave?: () => void;
    showSkip?: boolean;
    showBack?: boolean;
    showNext?: boolean;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}

const HealthInformationLayout: React.FC<HealthInformationLayoutProps> = ({
    onBack,
    onSave,
    title,
    subtitle,
    children,

}) => (
    <IonPage>
        <IonContent fullscreen>
            <div className="px-6 pb-20">
                <div className="sticky top-0 z-99 bg-white py-6"
                    style={{ paddingTop: "var(--safe-area-inset-top)" }}
                >
                </div>
                <HealthInformationHeaderProgress title={title} subtitle={subtitle} />
                <div>{children}</div>
                <ActionHealInformation onBack={onBack} onSave={onSave} />
            </div>
        </IonContent>
    </IonPage>
);

export default HealthInformationLayout;