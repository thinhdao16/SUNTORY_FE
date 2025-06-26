import HealthInformationStepLayout from "@/components/layout/HealthInformationStepLayout";
import { useStepGuard } from "@/hooks/useStepGuard";
import { useStepProgress } from "@/hooks/useStepProgress";
import { t } from "@/lib/globalT"; // Thêm dòng này


function HealthInfo() {
    const {
        steps,
        handleNext,
        handleStepClick,
        handleBack,
        currentStep
    } = useStepProgress();
    useStepGuard(1);

    return (
        <HealthInformationStepLayout
            steps={steps}
            current={currentStep}
            onStepClick={handleStepClick}
            onBack={handleBack}
            onNext={handleNext}
            showSkip={true}
            title={t("Health Status")}
            subtitle={t("Select the diseases you have (if any)")}
        >
            <div>
                children
            </div>
        </HealthInformationStepLayout>
    )
}

HealthInfo.propTypes = {}

export default HealthInfo
