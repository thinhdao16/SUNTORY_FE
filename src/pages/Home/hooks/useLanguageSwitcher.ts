import { getListLanguage } from '@/services/language/language-service';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useAuthInfo } from '@/pages/Auth/hooks/useAuthInfo';
import { updateDeviceLanguage } from '@/services/device/device-service';
import useDeviceInfo from '@/hooks/useDeviceInfo';
import { UpdateDeviceLanguagePayload } from '@/services/device/device-type';

export const useLanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const [showLanguageOptions, setShowLanguageOptions] = useState(false);
    const [languageLoading, setLanguageLoading] = useState(false);
    const { refetch } = useAuthInfo();
    const { deviceId } = useDeviceInfo();
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
        // Normalize query result to array
        const list: any[] = Array.isArray(languages) ? (languages as any[]) : ((languages as any)?.data ?? []);
        const language = list.find((item: any) => (item?.code ?? item?.data?.code) === norm);

        if (language) {
            const payload: UpdateDeviceLanguagePayload = {
                deviceId: deviceId || '',
                languageId: language?.id ?? language?.data?.id,
            };
            await updateDeviceLanguage(payload);
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
