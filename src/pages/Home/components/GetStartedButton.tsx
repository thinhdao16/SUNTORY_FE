import React from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface GetStartedButtonProps {
    getChatLink: (topicId: number) => string;
    chatTopicId: number;
}

export const GetStartedButton: React.FC<GetStartedButtonProps> = ({ getChatLink, chatTopicId }) => {
    const history = useHistory();
    const { t } = useTranslation();

    return (
        <div className="mt-4">
            <div
                className="bg-gradient-to-r from-primary-400 to-main rounded-xl p-4 text-center text-white font-semibold cursor-pointer"
                onClick={() => {
                    const link = getChatLink(chatTopicId);
                    history.push(link);
                }}
            >
                {t("Get Started")}
            </div>
        </div>
    );
};
