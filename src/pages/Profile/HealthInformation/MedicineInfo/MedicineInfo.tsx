import HealthInformationStepLayout from "@/components/layout/HealthInformationStepLayout";
import StepProgress from "@/components/step-progress/StepProgress";
import { useStepGuard } from "@/hooks/useStepGuard";
import { useStepProgress } from "@/hooks/useStepProgress";


function MedicineInfo() {
    const {
        steps,
        handleNext,
        handleStepClick,
        handleBack,
        currentStep
    } = useStepProgress();
    useStepGuard(3);
    return (
        <HealthInformationStepLayout
            steps={steps}
            current={currentStep}
            onStepClick={handleStepClick}
            onBack={handleBack}
            onNext={handleNext}
            showSkip={true}
            title={t("Current Medications")}
            subtitle={t("List the medications you are taking regularly")}
        >
            <div>
                children
            </div>
        </HealthInformationStepLayout>
    )
}

MedicineInfo.propTypes = {}

export default MedicineInfo
