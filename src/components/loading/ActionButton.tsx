import React from "react";

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    children?: React.ReactNode;
    variant?: "primary" | "danger" | "ghost";
    size?: "sm" | "md" | "lg"| "none";
    ariaLabel?: string;
}

const classByVariant = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "bg-white text-gray-700 hover:bg-gray-50",
};

const classBySize = {
    sm: "px-2 py-1 text-sm",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-2 text-base",
    none:""
};

export default function ActionButton({
    loading = false,
    children,
    variant = "ghost",
    size = "md",
    disabled,
    ariaLabel,
    ...rest
}: ActionButtonProps) {
    return (
        <button
            aria-label={ariaLabel}
            aria-busy={loading}
            disabled={disabled || loading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl transition disabled:opacity-50 ${classByVariant[variant]} ${classBySize[size]}`}
            {...rest}
        >
            {loading && (
                <svg className="animate-spin w-4 h-4 text-current" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
            )}
            <span>{children}</span>
        </button>
    );
}