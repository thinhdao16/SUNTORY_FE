import React from "react";

interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
    bgColor?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({
    children,
    className = "",
    bgColor = "bg-white",
}) => {
    return (
        <div className={`min-h-screen overflow-y-auto flex flex-col ${bgColor} pb-24 ${className}`}>
            <div className="flex-1 overflow-y-auto">
                {children}
            </div>
        </div>

    );
};

export default PageContainer;