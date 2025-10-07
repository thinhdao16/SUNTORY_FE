import React from 'react';
import { useTranslation } from 'react-i18next';
import BackIcon from "@/icons/logo/back-default.svg?react";
import MoreIcon from "@/icons/logo/more-default.svg?react";

interface PostHeaderProps {
    displayPost: any;
    isOwnPost: boolean;
    onBack: () => void;
    onPostOptions: () => void;
    onUserProfileClick?: (userId: number) => void;
}

const PostHeader: React.FC<PostHeaderProps> = ({
    displayPost,
    isOwnPost,
    onBack,
    onPostOptions,
    onUserProfileClick
}) => {
    const { t } = useTranslation();

    return (
        <div className="relative flex items-center justify-between px-6 h-[50px] border-b border-gray-100">
            <div className="flex items-center gap-4 z-10">
                <button onClick={onBack}>
                    <BackIcon />
                </button>
                <span className="font-semibold">
                    {isOwnPost ? t('Your Post') : (
                        <span className="flex items-center">
                            <span 
                                className="max-w-[250px] truncate inline-block cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => onUserProfileClick?.(displayPost?.user?.id)}
                            >
                                {displayPost?.user?.fullName}
                            </span>
                            <span>'s Post</span>
                        </span>
                    )}
                </span>

            </div>
            <div className="flex items-center justify-end z-10">
                <button onClick={onPostOptions} aria-label="Post actions">
                    <MoreIcon />
                </button>
            </div>
        </div>
    );
};

export default PostHeader;
