import React from "react";
import ButtonProgressStepHealthInformation from "./ButtonProgressStepHealthInformation";

interface ActionHealInformationProps {
    onBack?: () => void;
    onSave?: () => void;
    showBack?: boolean;
    showSave?: boolean;
}

const ActionHealInformation: React.FC<ActionHealInformationProps> = ({
    onBack,
    onSave,
    showBack = true,
    showSave = true,
}) => {
    return (
        <div className="flex justify-between w-full py-6">
            {showBack ? (
                <ButtonProgressStepHealthInformation onClick={onBack}>
                    {t("Back")}
                </ButtonProgressStepHealthInformation>
            ) : (
                <div />
            )}
            {showSave ? (
                <ButtonProgressStepHealthInformation onClick={onSave}>
                    {t("Save")}
                </ButtonProgressStepHealthInformation>
            ) : (
                <div />
            )}
        </div>
    );
};

export default ActionHealInformation;
