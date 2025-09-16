import React from 'react';
import { useTranslation } from 'react-i18next';

const SocialStoryListRequest: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="p-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">
                    {t('Story Requests')}
                </h2>
                <p className="text-gray-500">
                    {t('Manage story viewing permissions')}
                </p>
            </div>

            <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">{t('Pending Requests')}</h3>
                    
                    <div className="text-center py-8 text-gray-400">
                        <p>{t('No pending requests')}</p>
                        <p className="text-sm">{t('Story view requests will appear here')}</p>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">{t('Blocked Users')}</h3>
                    
                    <div className="text-center py-8 text-gray-400">
                        <p>{t('No blocked users')}</p>
                        <p className="text-sm">{t('Users you\'ve blocked from viewing your stories')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SocialStoryListRequest;
