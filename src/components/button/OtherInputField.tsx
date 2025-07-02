import React from "react";
import SendIcon from "@/icons/logo/send.svg?react";

interface OtherInputFieldProps {
    label: string;
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    inputClassName?: string;
    labelClassName?: string;
    containerClassName?: string;
    buttonClassName?: string;
    disabled?: boolean;
}

const OtherInputField: React.FC<OtherInputFieldProps> = ({
    label,
    placeholder,
    value,
    onChange,
    inputClassName = "w-full border border-netural-200 focus:outline-0 focus:border-main rounded-xl px-4 py-2",
    labelClassName = "mb-2 font-medium",
    containerClassName = "",
    buttonClassName = "absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-main",
    disabled = true,
}) => (
    <div className={containerClassName}>
        <div className={labelClassName}>{label}</div>
        <div className="relative">
            <input
                className={inputClassName}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
            <button
                type="button"
                className={buttonClassName}
                tabIndex={-1}
                disabled={disabled}
            >
                <SendIcon />
            </button>
        </div>
    </div>
);

export default OtherInputField;