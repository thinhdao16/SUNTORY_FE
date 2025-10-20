import React from 'react';
import { useTranslation } from 'react-i18next';

interface HowItWorksItem {
    step: number;
    title: string;
    desc: string;
}

interface HowItWorksSectionProps {
    items: HowItWorksItem[];
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ items }) => {
    const { t } = useTranslation();

    return (
        <div className="mt-6">
            <span className="font-bold text-[22px] text-gray-900 mb-1">{t("How It Works")}</span>
            <span className="text-netural-400 text-sm mb-4 block">{t("Three simple steps to better health")}</span>
            <div className="flex flex-col gap-4">
                {items.map((item) => (
                    <div key={item.step} className="flex items-center gap-3 bg-white rounded-xl p-4">
                        <div className="h-10 aspect-square flex items-center justify-center rounded-full bg-main text-white font-bold">
                            {item.step}
                        </div>
                        <div>
                            <div className="font-semibold text-gray-900">{item.title}</div>
                            <div className="text-gray-500 text-sm leading-none">{item.desc}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
