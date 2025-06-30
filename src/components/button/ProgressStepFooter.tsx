import React from "react";
import ButtonProgressStepHealthInformation from "./ButtonProgressStepHealthInformation";

interface ProgressStepFooterProps {
    onBack?: () => void;
    onNext?: () => void;
    onSkip?: () => void;
    showBack?: boolean;
    showNext?: boolean;
    showSkip?: boolean;
}

const ProgressStepFooter: React.FC<ProgressStepFooterProps> = ({
    onBack,
    onNext,
    onSkip,
    showBack = true,
    showNext = true,
    showSkip = true,
}) => {
    return (
        <div className="flex flex-col justify-center items-center gap-4 py-6">
            <div className="flex justify-between w-full">
                {showBack && (
                    <ButtonProgressStepHealthInformation onClick={onBack}>
                        {t("Back")}
                    </ButtonProgressStepHealthInformation>
                )}
                {showNext && (
                    <ButtonProgressStepHealthInformation onClick={onNext}>
                        {t("Next")}
                    </ButtonProgressStepHealthInformation>
                )}
            </div>
            {showSkip && (
                <ButtonProgressStepHealthInformation
                    onClick={onSkip ?? onNext}
                    className="w-fit border-0 !font-normal"
                >
                    {t("Skip")}
                </ButtonProgressStepHealthInformation>
            )}
        </div>
    );
};

export default ProgressStepFooter;
