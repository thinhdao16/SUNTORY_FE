import React from "react";

interface HealthInformationHeaderProgressProps {
    title: string;
    subtitle?: string;
}

const HealthInformationHeaderProgress: React.FC<HealthInformationHeaderProgressProps> = ({
    title,
    subtitle,
}) => (
    <div className="pt-4 pb-2 bg-white">
        <h2 className="text-2xl font-semibold text-main mb-1">{title}</h2>
        {subtitle && (
            <p className="text-netural-400 mb-2 text-sm">{subtitle}</p>
        )}
        <hr className="border-netural-200" />
    </div>
);

export default HealthInformationHeaderProgress;