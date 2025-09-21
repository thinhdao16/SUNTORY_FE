import React from 'react';
import { useTranslation } from 'react-i18next';

const SocialStoryCamera: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="h-full bg-black relative">
            <div className="flex items-center justify-center h-full">
                <div className="text-white text-center">
                    <h2 className="text-xl font-semibold mb-2">
                        {t('Story Camera')}
                    </h2>
                    <p className="text-gray-300">
                        {t('Capture your story moment')}
                    </p>
                </div>
            </div>

            {/* Camera controls */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8">
                <button className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    <div className="w-14 h-14 border-4 border-gray-300 rounded-full"></div>
                </button>
            </div>
        </div>
    );
};

export default SocialStoryCamera;
