import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SparklesIcon from "@/icons/logo/AI_thinking.svg?react";

type ThinkingStatusProps = {
    doneSteps?: number;
    className?: string;
    scrollToBottom: () => void;
};

export default function ThinkingStatus({ doneSteps = 0, className = "", scrollToBottom }: ThinkingStatusProps) {
    const [currentStep, setCurrentStep] = useState(1);

    useEffect(() => {
        if (doneSteps < 2) {
            const t = setTimeout(() => setCurrentStep(2), 1000);
            return () => clearTimeout(t);
        }
    }, [doneSteps]);

    useEffect(() => {
        if (scrollToBottom) {
            const timeoutId = setTimeout(() => {
                scrollToBottom();
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [currentStep, doneSteps, scrollToBottom]);

    const step1Done = doneSteps >= 1 || currentStep > 1;
    const step2Done = doneSteps >= 2;

    return (
        <div className={`flex items-start gap-2 ${className}`}>
            <div className="space-y-6">
                <div className="flex-1">
                    <div
                        className="inline-flex items-center gap-2 bg-chat-to backdrop-blur-sm px-4 py-3 rounded-tl-0 rounded-tr-[16px] rounded-bl-[16px] rounded-br-[16px]"
                    >
                        <SparklesIcon className="w-5 h-5 text-blue-400" />
                        <motion.span
                            className="font-medium text-gray-700 relative "
                            initial={{ opacity: 0.2 }}
                            animate={{ opacity: 0.8 }}
                            transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                repeatType: 'reverse',
                                ease: 'easeInOut',
                            }}
                        >
                            {t(" Thinking…")}
                        </motion.span>
                    </div>
                </div>
                <div className="flex flex-col gap-1 ">
                    <div className="flex items-start gap-2">
                        <StepDot state={step1Done ? "done" : "loading"} />
                        <p className="text-sm text-gray-600">{t("Understanding the question and context")}</p>
                    </div>
                    {
                        currentStep >= 2 && (
                            <>
                                <div className="  w-[1px] bg-gray-200 h-4 ml-2" />
                                <div className="flex items-start gap-2">
                                    <StepDot state={currentStep >= 2 ? (step2Done ? "done" : "loading") : "idle"} />
                                    <p className="text-sm text-gray-600">{t("Retrieving relevant information")}</p>
                                </div>
                            </>
                        )
                    }

                </div>
            </div>
        </div>
    );
}

function StepDot({ state }: { state: "loading" | "done" | "idle" }) {
    if (state === "done") {
        return (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500">
                <svg viewBox="0 0 20 20" className="w-3 h-3 text-white">
                    <path fill="currentColor" d="M7.6 13.2L4.4 10l-1 1 4.2 4.2L16.6 6.2l-1-1z" />
                </svg>
            </span>
        );
    }
    if (state === "loading") {
        return (
            <span className="inline-grid place-items-center w-5 h-5">
                <span className="absolute w-5 h-5 rounded-full border border-emerald-400/40" />
                <svg viewBox="0 0 24 24" className="w-5 h-5 animate-spin">
                    <circle
                        cx="12"
                        cy="12"
                        r="9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-emerald-400/30"
                    />
                    <path
                        d="M21 12a9 9 0 0 0-9-9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-emerald-500"
                    />
                </svg>
            </span>
        );
    }
    return (
        <span className="inline-grid place-items-center w-5 h-5">
            <span className="absolute w-5 h-5 rounded-full border border-gray-300" />
        </span>
    );
}
