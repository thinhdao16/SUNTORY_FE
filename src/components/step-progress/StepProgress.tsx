import React from "react";

interface StepProgressProps {
    steps: string[];
    current: number;
    onStepClick?: (idx: number) => void;
}

const StepProgress: React.FC<StepProgressProps> = ({ steps, current, onStepClick }) => (
    <div className="flex items-center w-full mb-4 sm:mb-5 ">
        {steps.map((step, idx) => (
            <React.Fragment key={step}>
                <div
                    className={`flex flex-col items-center w-auto mx-0.5 relative ${onStepClick ? "cursor-pointer" : ""}`}
                    onClick={() => onStepClick && onStepClick(idx)}
                >
                    <div
                        className={`flex items-center justify-center w-5 h-5 rounded-full lg:h-8 lg:w-8
              ${idx <= current ? "bg-main text-white border-2 border-main" : "bg-white border-[1px] border-main text-main"}
            `}
                    >
                        <span className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-current block"></span>
                    </div>
                    <span className={`absolute top-6 lg:top-9 lg:text-[10px] text-[8px] whitespace-nowrap `}>
                        {step}
                    </span>
                </div>
                {idx < steps.length - 1 && (
                    <div className="flex items-center flex-1 h-5">
                        <div className={`h-[1px] w-full ${idx < current ? "bg-main" : "bg-gray-200"}`}></div>
                    </div>
                )}
            </React.Fragment>
        ))}
    </div>
);

export default StepProgress;