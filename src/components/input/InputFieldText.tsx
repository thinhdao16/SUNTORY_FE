import React from "react";
import NormalizedInput from "@/components/common/NormalizedInput";

interface InputFieldTextProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    className?: string;
    labelClassName?: string;
    inputClassName?: string;
    error?: string;
    validateType?: "email" | "phone";
    required?: boolean;
}


const InputTextField = React.forwardRef<HTMLInputElement, InputFieldTextProps>(
    (
        {
            label,
            id,
            type = "text",
            placeholder,
            className = "",
            labelClassName = "",
            inputClassName = "",
            required,
            error,
            validateType,
            ...rest
        },
        ref
    ) => {
        return (
            <div className={`w-full ${className}`}>
                <label htmlFor={id} className={`block text-sm font-medium ${labelClassName}`}>
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <NormalizedInput
                    ref={ref}
                    type={type}
                    id={id}
                    placeholder={placeholder}
                    className={`mt-1 block w-full px-4 py-3 border ${error
                        ? "border-red-500"
                        : "border-netural-200"
                        } rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${inputClassName}`}
                    {...rest}
                />
                {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
            </div>
        );
    }
);

export default InputTextField;
