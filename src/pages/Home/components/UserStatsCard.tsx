import React from 'react';
import { useTranslation } from 'react-i18next';

interface UserStatsCardProps {
    bmi: string | number;
    age: string | number;
    height: string;
    weight: string;
}

export const UserStatsCard: React.FC<UserStatsCardProps> = ({ bmi, age, height, weight }) => {
    const { t } = useTranslation();

    return (
        <div className="mt-6 bg-white bg-opacity-90 rounded-2xl flex justify-between items-center px-6 py-4 w-full max-w-xl mx-auto">
            <div className="flex-1 text-center">
                <div className="text-main font-medium">{t("BMI")}</div>
                <div className="text-sm text-netural-300">{bmi}</div>
            </div>
            <div className="w-[0.5px] h-9 bg-netural-300 mx-2" />
            <div className="flex-1 text-center">
                <div className="text-main font-medium">{t("Age")}</div>
                <div className="text-sm text-netural-300">{age}</div>
            </div>
            <div className="w-[0.5px] h-9 bg-netural-300 mx-2" />
            <div className="flex-1 text-center">
                <div className="text-main font-medium">{t("Height")}</div>
                <div className="text-sm text-netural-300">{height}</div>
            </div>
            <div className="w-[0.5px] h-9 bg-netural-300 mx-2" />
            <div className="flex-1 text-center">
                <div className="text-main font-medium">{t("Weight")}</div>
                <div className="text-sm text-netural-300">{weight}</div>
            </div>
        </div>
    );
};
