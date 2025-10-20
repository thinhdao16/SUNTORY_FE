import HealthInformationStepLayout from "@/components/layout/HealthInformationStepLayout";
import { useStepGuard } from "@/hooks/useStepGuard";
import { useStepProgress } from "@/hooks/useStepProgress";

function Confirm() {
    const {
        steps,
        handleNext,
        handleStepClick,
        handleBack,
        currentStep
    } = useStepProgress();
    useStepGuard(4);
    return (
        <HealthInformationStepLayout
            steps={steps}
            current={currentStep}
            onStepClick={handleStepClick}
            onBack={handleBack}
            onNext={handleNext}
            showNext={false}
            showSkip={true}
            title={t("Confirm Information")}
            subtitle={t("Please review your information")}
        >
            <div>
                {t("children")}</div>
        </HealthInformationStepLayout>
    )
}

Confirm.propTypes = {}

export default Confirm
