import React from 'react';
import { languages } from '@/constants/languageLocale';
import ChineseIcon from '@/icons/logo/flag/chinese.svg?react';
import VietnameseIcon from '@/icons/logo/flag/vietnam.svg?react';
import USAIcon from '@/icons/logo/flag/usa.svg?react';

interface LanguageSwitcherProps {
    i18n: any;
    showLanguageOptions: boolean;
    setShowLanguageOptions: (show: boolean) => void;
    languageLoading: boolean;
    handleLanguageChange: (langCode: string) => void;
}

const getFlagIcon = (langCode: string) => {
    switch (langCode) {
        case 'vi':
            return <VietnameseIcon className="w-5 h-5 rounded-full" />;
        case 'en':
            return <USAIcon className="w-5 h-5 rounded-full" />;
        case 'zh':
            return <ChineseIcon className="w-5 h-5 rounded-full" />;
        default:
            return <USAIcon className="w-5 h-5 rounded-full" />;
    }
};

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
    i18n,
    showLanguageOptions,
    setShowLanguageOptions,
    languageLoading,
    handleLanguageChange,
}) => {
    // ✅ Thêm logic xử lý short language code
    const shortLang = i18n.language?.split("-")[0] || "en";
    const currentLang = languages.find(opt => opt.code === shortLang)?.label || shortLang;

    return (
        <div className="relative language-dropdown text-sm w-[70px]">
            <button
                className="flex items-center gap-1 bg-white w-full backdrop-blur-sm rounded-full px-2 py-1 text-white font-medium whitespace-nowrap"
                onClick={() => setShowLanguageOptions(!showLanguageOptions)}
                disabled={languageLoading}
            >
                <span className="flex-shrink-0">
                    {getFlagIcon(shortLang)} {/* ✅ Sử dụng shortLang */}
                </span>
                <span className="whitespace-nowrap text-main font-semibold">
                    {currentLang} {/* ✅ Sử dụng currentLang */}
                </span>
                <svg
                    className={`w-4 h-4 rounded-full transition-transform flex-shrink-0 ${showLanguageOptions ? 'rotate-180 text-main' : 'text-main'}`}
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
                        .filter(lang => lang.code !== shortLang) // ✅ Filter bằng shortLang
                        .map((lang, index, filteredArray) => (
                            <React.Fragment key={lang.code}>
                                <button
                                    className="w-full px-3 py-1 text-left hover:bg-gray-50 flex items-center gap-1 whitespace-nowrap text-main font-semibold"
                                    onClick={() => handleLanguageChange(lang.code)}
                                    disabled={languageLoading}
                                >
                                    <span className="flex-shrink-0">
                                        {getFlagIcon(lang.code)}
                                    </span>
                                    <span className="flex-shrink-0">{lang.label}</span>
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
