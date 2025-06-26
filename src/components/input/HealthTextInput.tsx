import React from "react";
import { FieldError, UseFormRegister } from "react-hook-form";

interface HealthTextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    name: string;
    register: UseFormRegister<any>;
    required?: boolean;
    error?: FieldError;
    logo?: React.ReactNode;
    classNameContainer?: string;
    inputRef?: React.Ref<HTMLInputElement>;
}

const HealthTextInput: React.FC<HealthTextInputProps> = ({
    label,
    name,
    register,
    required = false,
    error,
    logo,
    classNameContainer,
    className = "",
    inputRef,
    ...rest
}) => (
    <div className={`mb-2 ${classNameContainer} w-full`}>
        <label className="block font-medium mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
            <input
                {...register(name, { required })}
                ref={el => {
                    register(name).ref(el);
                    if (typeof inputRef === "function") {
                        inputRef(el);
                    } else if (inputRef && typeof inputRef === "object") {
                        (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                    }
                }}
                className={`w-full border border-netural-200 rounded-xl px-4 py-2 pr-10 ${error ? "border-red-500" : ""} ${className}`}
                {...rest}
            />
            {logo && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    {logo}
                </span>
            )}
        </div>
        {error && (
            <div className="text-red-500 text-xs mt-1">
                {error.message || t("This field is required")}
            </div>
        )}
    </div>
);

export default HealthTextInput;