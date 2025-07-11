import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useLanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const [showLanguageOptions, setShowLanguageOptions] = useState(false);
    const [languageLoading, setLanguageLoading] = useState(false);

    const handleLanguageChange = async (langCode: string) => {
        setLanguageLoading(true);
        await i18n.changeLanguage(langCode);
        setLanguageLoading(false);
        setShowLanguageOptions(false);
    };

    // Close language dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.language-dropdown')) {
                setShowLanguageOptions(false);
            }
        };

        if (showLanguageOptions) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showLanguageOptions]);

    return {
        i18n,
        showLanguageOptions,
        setShowLanguageOptions,
        languageLoading,
        handleLanguageChange,
    };
};
