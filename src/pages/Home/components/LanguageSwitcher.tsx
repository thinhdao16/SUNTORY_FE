import React from 'react';
import { languages } from '@/constants/languageLocale';

interface LanguageSwitcherProps {
    i18n: any;
    showLanguageOptions: boolean;
    setShowLanguageOptions: (show: boolean) => void;
    languageLoading: boolean;
    handleLanguageChange: (langCode: string) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
    i18n,
    showLanguageOptions,
    setShowLanguageOptions,
    languageLoading,
    handleLanguageChange,
}) => (
    <div className="relative language-dropdown">
        <button
            className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-sm font-medium whitespace-nowrap"
            onClick={() => setShowLanguageOptions(!showLanguageOptions)}
            disabled={languageLoading}
        >
            <span className="text-lg">
                {i18n.language === 'vi' ? '🇻🇳' : i18n.language === 'en' ? '🇺🇸' : '🇨🇳'}
            </span>
            <span className="whitespace-nowrap">
                {languages.find(lang => lang.code === i18n.language)?.label || 'Language'}
            </span>
            <svg
                className={`w-4 h-4 transition-transform flex-shrink-0 ${showLanguageOptions ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>

        {showLanguageOptions && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg py-2 min-w-[140px] z-50">
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 whitespace-nowrap ${i18n.language === lang.code ? 'bg-blue-50 text-main font-semibold' : 'text-gray-700'
                            }`}
                        onClick={() => handleLanguageChange(lang.code)}
                        disabled={languageLoading}
                    >
                        <span className="text-lg flex-shrink-0">
                            {lang.code === 'vi' ? '🇻🇳' : lang.code === 'en' ? '🇺🇸' : '🇨🇳'}
                        </span>
                        <span className="flex-shrink-0">{lang.label}</span>
                        {i18n.language === lang.code && (
                            <span className="ml-auto text-main flex-shrink-0">✓</span>
                        )}
                    </button>
                ))}
            </div>
        )}
    </div>
);
