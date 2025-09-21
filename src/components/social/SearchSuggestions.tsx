import React from 'react';
import { SearchUser } from '@/services/social/search-service';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg";
import { IoCheckmarkCircle } from 'react-icons/io5';

interface SearchSuggestionsProps {
    users: SearchUser[];
    isLoading: boolean;
    onUserSelect: (user: SearchUser) => void;
    onClearRecent?: () => void;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
    users,
    isLoading,
    onUserSelect,
    onClearRecent
}) => {
    if (isLoading) {
        return (
            <div className="p-4">
                <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                        <div key={index} className="flex items-center gap-3 animate-pulse">
                            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
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
        <div className="bg-white border-t border-gray-100">
            <div className="px-4 py-2">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">Recent</span>
                    {onClearRecent && (
                        <button
                            onClick={onClearRecent}
                            className="text-xs text-blue-500 hover:text-blue-600"
                        >
                            Clear all
                        </button>
                    )}
                </div>
                <div className="space-y-1">
                    {users.map((user) => (
                        <button
                            key={user.id}
                            onClick={() => onUserSelect(user)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <img
                                src={user.avatar || avatarFallback}
                                alt={user.fullName}
                                className="w-12 h-12 rounded-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = avatarFallback;
                                }}
                            />
                            <div className="flex-1 text-left">
                                <div className="flex items-center gap-1">
                                    <span className="font-medium text-gray-900">{user.fullName}</span>
                                    {user.isVerified && (
                                        <IoCheckmarkCircle className="w-4 h-4 text-blue-500" />
                                    )}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {user.username}
                                    {user.postCount !== undefined && (
                                        <span className="ml-1">• {user.postCount} new posts</span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SearchSuggestions;
