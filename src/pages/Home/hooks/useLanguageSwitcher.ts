import { getListLanguage } from '@/services/language/language-service';
import { updateAccountInformationV3 } from '@/services/auth/auth-service';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useAuthInfo } from '@/pages/Auth/hooks/useAuthInfo';

export const useLanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const [showLanguageOptions, setShowLanguageOptions] = useState(false);
    const [languageLoading, setLanguageLoading] = useState(false);
    const { refetch } = useAuthInfo();
    const { data: languages } = useQuery({
        queryKey: ['languages'],
        queryFn: getListLanguage,
    });

    const handleLanguageChange = async (langCode: string, isFeeching: boolean = true) => {
        setLanguageLoading(true);
        if (isFeeching === true) await handleUpdateUserLanguage(langCode);
        await i18n.changeLanguage(langCode);
        setLanguageLoading(false);
        setShowLanguageOptions(false);
    };

    const handleUpdateUserLanguage = async (langCode: string) => {
        // Normalize ui code -> backend code
        let norm = langCode;
        if (norm === 'vi') norm = 'vn';
        if (norm === 'zh') norm = 'cn';

        // Normalize query result to array
        const list: any[] = Array.isArray(languages) ? (languages as any[]) : ((languages as any)?.data ?? []);

        const language = list.find((item: any) => (item?.code ?? item?.data?.code) === norm);
        if (language) {
            await updateAccountInformationV3({
                languageId: language?.id ?? language?.data?.id,
            });
            await refetch();
        }
    };

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
