import React from 'react';
import { SearchUser } from '@/services/social/search-service';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg";
import { IoCheckmarkCircle } from 'react-icons/io5';
import { formatTimeFromNow } from '@/utils/formatTime';
import { useTranslation } from 'react-i18next';

interface SearchSuggestionsProps {
    users: SearchUser[];
    isLoading: boolean;
    onUserSelect: (userId: number) => void;
    onClearRecent?: () => void;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
    users,
    isLoading,
    onUserSelect,
    onClearRecent
}) => {
    const { t } = useTranslation();
    if (isLoading) {
        return (
            <div className="px-4 py-3">
                {/* <div className="flex items-center mb-2">
                    <h3 className="font-semibold">{t('Suggestions')}</h3>
                </div> */}
                <div className="space-y-1">
                    {[...Array(3)].map((_, index) => (
                        <div key={index} className="flex items-center gap-3 py-2 animate-pulse">
                            <div className="w-15 h-15 bg-gray-200 rounded-2xl"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                                <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    if (users.length === 0) {
        return null;
    }

    return (
        <div className="px-4 py-3">
            {/* <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{t('Suggestions')}</h3>
                {onClearRecent && (
                    <button
                        onClick={onClearRecent}
                        className="text-sm text-blue-500 hover:text-blue-600"
                    >
                        {t('Clear')}
                    </button>
                )}
            </div>
             */}
            <div className="space-y-1">
                {users?.map((user) => (
                    <button
                        key={user.id}
                        onClick={() => onUserSelect(user.id)}
                        className="w-full flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                        <img
                            src={user.avatar || avatarFallback}
                            alt={user.fullName}
                            className="w-15 h-15 rounded-2xl object-cover flex-shrink-0"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = avatarFallback;
                            }}
                        />
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                                <span className="text-gray-900 font-semibold truncate">
                                    {user.fullName}
                                </span>
                                {user.isVerified && (
                                    <IoCheckmarkCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                )}
                            </div>
                            {/* <div className="text-netural-300 truncate ">
                                {user.username || user.id}
                            </div> */}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SearchSuggestions;
