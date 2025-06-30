import { useEffect } from "react";
import { useStepProgress } from "@/hooks/useStepProgress";

export function useStepGuard(stepIndex: number) {
    const { visitedSteps, goToLastVisitedStep, currentStep } = useStepProgress();

    useEffect(() => {
        if (!visitedSteps[stepIndex]) {
            goToLastVisitedStep();
        }
    }, [stepIndex, visitedSteps, goToLastVisitedStep, currentStep]);
}