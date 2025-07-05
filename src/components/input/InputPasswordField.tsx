import React, { useState, forwardRef } from "react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import LockIcon from "@/icons/logo/lock.svg?react";

interface InputPasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    showIcon?: boolean;
}

const InputPasswordField = forwardRef<HTMLInputElement, InputPasswordFieldProps>(
    (
        {
            label = t("Password"),
            id = "password",
            placeholder = t("Enter your password"),
            required = false,
            error,
            showIcon = true,
            ...rest
        },
        ref
    ) => {

        const [showPassword, setShowPassword] = useState(false);
        return (
            <div>
                <label
                    htmlFor={id}
                    className="block text-sm font-medium "
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                    {showIcon && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <LockIcon />
                        </span>
                    )}
                    <input
                        type={showPassword ? "text" : "password"}
                        id={id}
                        ref={ref}
                        placeholder={placeholder}
                        // required={required}
                        className={`mt-1 block w-full px-3 py-3 ${showIcon ? "pl-10" : ""} border ${error ? "border-red-500" : "border-gray-300 darkk:border-gray-600"} rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500 darkk:bg-gray-700 darkk:text-gray-300 `}
                        style={
                            !showPassword
                                ? { letterSpacing: "0px" }
                                : undefined
                        }
                        {...rest}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-500 darkk:text-gray-300"
                        tabIndex={-1}
                        aria-label={showPassword ? t("Hide password") : t("Show password")}
                    >
                        {showPassword ? <IoEyeOutline /> : <IoEyeOffOutline />}
                    </button>
                </div>
                {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
            </div>
        );
    }
);

export default InputPasswordField;