import { useEffect } from "react";
import { useHeathInformationStore } from "@/store/zustand/health-information-store";
import { useHistory } from "react-router";

export const steps = [
    t("Basic"),
    t("Health"),
    t("Allergy"),
    t("Medication"),
    t("Confirmation"),
];

export function useStepProgress() {
    const currentStep = useHeathInformationStore((s) => s.currentStep);
    const visitedSteps = useHeathInformationStore((s) => s.visitedSteps);
    const setCurrentStep = useHeathInformationStore((s) => s.setCurrentStep);
    const markStepVisited = useHeathInformationStore((s) => s.markStepVisited);
    const history = useHistory();

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            const nextStep = currentStep + 1;

            markStepVisited(currentStep);
            setCurrentStep(nextStep);
            markStepVisited(nextStep);
            history.push(`/health-information/progress-${nextStep + 1}`);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            const prevStep = currentStep - 1;
            setCurrentStep(prevStep);
            history.push(`/health-information/progress-${prevStep + 1}`);
        }
    };

    const handleStepClick = (idx: number) => {
        if (visitedSteps[idx]) {
            setCurrentStep(idx);
            history.push(`/health-information/progress-${idx + 1}`);
        }
    };

    const goToLastVisitedStep = () => {
        const lastIdx = visitedSteps.lastIndexOf(true);
        if (lastIdx > -1) {
            setCurrentStep(lastIdx);
            history.push(`/health-information/progress-${lastIdx + 1}`);
        }
    };

    useEffect(() => {
        markStepVisited(currentStep);
    }, [currentStep]);

    return {
        steps,
        currentStep,
        visitedSteps,
        setCurrentStep,
        handleNext,
        handleBack,
        handleStepClick,
        goToLastVisitedStep,
    };
}
