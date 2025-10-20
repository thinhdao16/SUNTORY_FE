import HealthInformationStepLayout from "@/components/layout/HealthInformationStepLayout";
import { useStepProgress } from "@/hooks/useStepProgress";
import { useStepGuard } from "@/hooks/useStepGuard";


function AllergyInfo() {
    const {
        steps,
        handleNext,
        handleStepClick,
        handleBack,
        currentStep
    } = useStepProgress();
    useStepGuard(2);

    return (
        <HealthInformationStepLayout
            steps={steps}
            current={currentStep}
            onStepClick={handleStepClick}
            onBack={handleBack}
            onNext={handleNext}
            showSkip={true}
            title={t("Allergy Information")}
            subtitle={t("Help us avoid allergy-causing recommendations")}
        >
            <div>
                children
            </div>
        </HealthInformationStepLayout>
    );
}

export default AllergyInfo;
