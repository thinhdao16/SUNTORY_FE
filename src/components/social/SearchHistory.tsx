import React from 'react';
import { useTranslation } from 'react-i18next';
import { SearchHistory as SearchHistoryType } from '@/services/social/search-service';
import { useSearchHistories } from '@/hooks/useSearchQueries';
import { IoTimeOutline, IoPersonOutline, IoSearchOutline } from 'react-icons/io5';
import { HiHashtag } from 'react-icons/hi';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg"
import RecentIcon from "@/icons/logo/recent.svg?react"
import { formatTimeFromNow } from '@/utils/formatTime';

interface SearchHistoryProps {
    onHistoryClick: (keyword: string) => void;
    onUserClick?: (userId: number) => void;
    onHashtagClick?: (hashtag: string) => void;
}

const SearchHistory: React.FC<SearchHistoryProps> = ({ onHistoryClick, onUserClick, onHashtagClick }) => {
    const { t } = useTranslation();
    const { data: histories = [], isLoading } = useSearchHistories(0, 20);
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 1) {
            return t('Just now');
        } else if (diffInHours < 24) {
            return t('{{hours}} hours ago', { hours: diffInHours });
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return t('{{days}} days ago', { days: diffInDays });
        }
    };

    const getDisplayContent = (history: SearchHistoryType) => {
        if (history.searchType === 20 && history.targetUser) {
            return {
                text: history.targetUser.fullName,
                subtitle: history.targetUser.userName || history.targetUser.email,
                avatar: history.targetUser.avatarUrl,
                icon: <IoPersonOutline className="w-4 h-4 text-gray-400" />,
                clickValue: history.targetUser.fullName,
                type: 'user',
                userId: history.targetUser.id
            };
        }
        else if (history.searchType === 40 && history.targetHashtag) {
            return {
                text: `#${history.targetHashtag.normalized}`,
                subtitle: null,
                avatar: null,
                icon: <HiHashtag className="w-4 h-4 text-blue-500" />,
                clickValue: `#${history.targetHashtag.normalized}`,
                type: 'hashtag',
                hashtag: history.targetHashtag.normalized
            };
        }
        else if (history.searchText) {
            return {
                text: history.searchText,
                subtitle: null,
                avatar: null,
                icon: <IoSearchOutline className="w-4 h-4 text-gray-400" />,
                clickValue: history.searchText,
                type: 'text'
            };
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (histories.length === 0) {
        return null;
    }
    return (
        <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold ">{t('Recent')}</h3>
            </div>
            
            <div className="space-y-1">
                {histories.map((history) => {
                    const displayContent = getDisplayContent(history);
                    if (!displayContent) return null;
                    return (
                        <button
                            key={history.id}
                            onClick={() => {
                                if (displayContent.type === 'user' && displayContent.userId && onUserClick) {
                                    onUserClick(displayContent.userId);
                                } else if (displayContent.type === 'hashtag' && displayContent.hashtag && onHashtagClick) {
                                    onHashtagClick(displayContent.hashtag);
                                } else {
                                    onHistoryClick(displayContent.clickValue);
                                }
                            }}
                            className="w-full flex items-center gap-3  py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                        >
                            {displayContent.userId ? (
                                <img
                                    src={displayContent.avatar || avatarFallback}
                                    alt={displayContent.text}
                                    className="w-15 h-15 rounded-2xl object-cover flex-shrink-0"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = avatarFallback;
                                    }}
                                />
                            ) : (
                                <div className="w-15 h-15 bg-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <RecentIcon/>
                                </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                                <div className="text-gray-900 font-semibold truncate">
                                    {displayContent.text}
                                </div>
                                {/* {displayContent.subtitle && (
                                    <div className=" text-netural-300 truncate">
                                        {displayContent.subtitle}
                                    </div>
                                )} */}
                            </div>
                            
                            {/* <span className="text-xs text-gray-400 flex-shrink-0">
                                {formatTimeFromNow(history.createDate, t)}
                            </span> */}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default SearchHistory;
