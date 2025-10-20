import React from "react";
import { IonPage, IonContent } from "@ionic/react";
import StepProgress from "@/components/step-progress/StepProgress";
import HealthInformationHeaderProgress from "@/components/header/HealthInformationHeaderProgress";
import ProgressStepFooter from "@/components/button/ProgressStepFooter";

interface HealthInformationStepLayoutProps {
    steps: string[];
    current: number;
    onStepClick?: (idx: number) => void;
    onBack?: () => void;
    onNext?: () => void;
    showSkip?: boolean;
    showBack?: boolean;
    showNext?: boolean;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}

const HealthInformationStepLayout: React.FC<HealthInformationStepLayoutProps> = ({
    steps,
    current,
    onStepClick,
    onBack,
    onNext,
    showSkip = true,
    title,
    subtitle,
    children,
    showBack = true,
    showNext = true,
}) => (
    <IonPage>
        <IonContent fullscreen>
            <div className="px-6 pb-20">
                <div className="sticky top-0 z-99 bg-white py-6"
                    style={{ paddingTop: "var(--safe-area-inset-top)" }}
                >
                    <StepProgress steps={steps} current={current} onStepClick={onStepClick} />
                </div>
                <HealthInformationHeaderProgress title={title} subtitle={subtitle} />
                <div>{children}</div>
                <ProgressStepFooter onBack={onBack} onNext={onNext} showSkip={showSkip} showBack={showBack} showNext={showNext} />
            </div>
        </IonContent>
    </IonPage>
);

export default HealthInformationStepLayout;