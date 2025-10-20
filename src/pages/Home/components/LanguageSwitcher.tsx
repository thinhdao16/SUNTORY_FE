import React, { useEffect, useState } from 'react';
import { languages } from '@/constants/languageLocale';
import ChineseIcon from '@/icons/logo/flag/chinese.svg?react';
import VietnameseIcon from '@/icons/logo/flag/vietnam.svg?react';
import USAIcon from '@/icons/logo/flag/usa.svg?react';

interface LanguageSwitcherProps {
    userLanguageCode?: string;
    i18n: any;
    isFeeching: boolean;
    showLanguageOptions: boolean;
    setShowLanguageOptions: (show: boolean) => void;
    languageLoading: boolean;
    handleLanguageChange: (langCode: string, isFeeching: boolean) => void;
    classNameButton?: string
}

const getFlagIcon = (langCode: string) => {
    switch (langCode) {
        case 'vi':
            return <VietnameseIcon className=" rounded-full" />;
        case 'en':
            return <USAIcon className=" rounded-full" />;
        case 'zh':
            return <ChineseIcon className=" rounded-full" />;
        default:
            return <USAIcon className=" rounded-full" />;
    }
};

// Map backend codes to UI codes ('vn'->'vi', 'cn'->'zh') and normalize to base (e.g., 'en-US'->'en')
const normalizeUiCode = (code?: string) => {
    const base = (code || '').split('-')[0];
    if (base === 'vn') return 'vi';
    if (base === 'cn') return 'zh';
    return base || 'en';
};

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
    userLanguageCode,
    isFeeching,
    i18n,
    showLanguageOptions,
    setShowLanguageOptions,
    languageLoading,
    handleLanguageChange,
    classNameButton
}) => {
    const uiCode = normalizeUiCode(i18n.language || userLanguageCode || 'en');
    console.log("uiCode", uiCode);
    console.log("i18n.language", i18n.language);
    console.log("userLanguageCode", userLanguageCode);
    // Keep i18n in sync with the UI code
    useEffect(() => {
        if (i18n.language !== uiCode) {
            i18n.changeLanguage(uiCode);
        }
    }, [uiCode]);


    const currentCode = uiCode;
    const currentLang = languages.find(opt => opt.code === currentCode)?.label || currentCode;

    return (
        <div className="relative language-dropdown text-sm w-[70px]">
            <button
                className={`flex items-center justify-between bg-white w-full rounded-full px-2 py-1.5 ${classNameButton}`}
                onClick={() => setShowLanguageOptions(!showLanguageOptions)}
                disabled={languageLoading}
            >
                <div className="flex items-center gap-1">
                    {getFlagIcon(currentCode)}
                    <span className="text-sm leading-none font-semibold text-main">{currentLang}</span>
                </div>
                <svg
                    className={`w-4 h-4 transition-transform ${showLanguageOptions ? 'rotate-180' : ''} text-main`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>


            {showLanguageOptions && (
                <div className="absolute right-0 top-full w-full mt-2 bg-white rounded-xl shadow-lg py-1.5 gap-1 grid z-50">
                    {languages
                        .filter(lang => lang.code !== currentCode)
                        .map((lang, index, filteredArray) => (
                            <React.Fragment key={lang.code}>
                                <button
                                    className="w-full px-3 py-1 text-left flex items-center  gap-1 whitespace-nowrap text-main font-semibold"
                                    onClick={() => handleLanguageChange(lang.code, isFeeching)}
                                    disabled={languageLoading}
                                >
                                    <span className="flex items-center gap-1">
                                        {getFlagIcon(lang.code)}
                                    </span>
                                    <span className="text-sm leading-none font-semibold text-main">{lang.label}</span>
                                </button>
                                {index < filteredArray.length - 1 && (
                                    <div className="mx-2 border-t border-gray-200"></div>
                                )}
                            </React.Fragment>
                        ))}
                </div>
            )}
        </div>
    );
};
