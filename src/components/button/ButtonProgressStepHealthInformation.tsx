import React from "react";

interface ButtonProgressStepHealthInformationProps {
    children: React.ReactNode;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
    className?: string;
    disabled?: boolean;
}

const ButtonProgressStepHealthInformation: React.FC<ButtonProgressStepHealthInformationProps> = ({
    children,
    onClick,
    type = "button",
    className = "",
    disabled = false,
}) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`px-2 py-0.5 text-sm font-semibold border border-main text-main rounded-xl  bg-white hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

export default ButtonProgressStepHealthInformation;