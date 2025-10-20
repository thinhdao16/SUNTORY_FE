import React from "react";

interface MainButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    className?: string;
}

const MainButton: React.FC<MainButtonProps> = ({ children, className = "", ...props }) => (
    <button
        {...props}
        className={`w-full px-4 py-2 bg-main text-white mt-6 rounded-xl hover:bg-blue-600 disabled:opacity-60 ${className}`}
    >
        {children}
    </button>
);

export default MainButton;