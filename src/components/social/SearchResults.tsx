import React, { useState } from 'react';
import { SearchUser, SearchPost } from '@/services/social/search-service';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg";
import { IoCheckmarkCircle, IoHeart, IoChatbubble } from 'react-icons/io5';
import { formatTimeFromNow } from '@/utils/formatTime';
import { useTranslation } from 'react-i18next';

interface SearchResultsProps {
    users: SearchUser[];
    posts: SearchPost[];
    searchQuery: string;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    onUserClick: (user: SearchUser) => void;
    onPostClick: (post: SearchPost) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
    users,
    posts,
    searchQuery,
    activeTab: propActiveTab,
    onTabChange,
    onUserClick,
    onPostClick
}) => {
    const { t } = useTranslation();
    const [localActiveTab, setLocalActiveTab] = useState<'all' | 'latest' | 'people' | 'posts'>('all');
    
    // Use prop activeTab if provided, otherwise use local state
    const activeTab = propActiveTab || localActiveTab;

    const tabs = [
        { key: 'all', label: 'All' },
        { key: 'latest', label: 'Latest' },
        { key: 'people', label: 'People' },
        { key: 'posts', label: 'Posts' }
    ];

    const renderUserItem = (user: SearchUser) => (
        <button
            key={user.id}
            onClick={() => onUserClick(user)}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
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
    );

    const renderPostItem = (post: SearchPost) => (
        <button
            key={post.code}
            onClick={() => onPostClick(post)}
            className="w-full p-3 hover:bg-gray-50 transition-colors"
        >
            <div className="flex gap-3">
                <img
                    src={post.user.avatar || avatarFallback}
                    alt={post.user.fullName}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = avatarFallback;
                    }}
                />
                <div className="flex-1 text-left">
                    <div className="flex items-center gap-1 mb-1">
                        <span className="font-medium text-sm text-gray-900">{post.user.fullName}</span>
                        {post.user.isVerified && (
                            <IoCheckmarkCircle className="w-3 h-3 text-blue-500" />
                        )}
                        <span className="text-xs text-gray-500">
                            • {formatTimeFromNow(post.createDate, t)}
                        </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                        {post.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                            <IoHeart className="w-3 h-3" />
                            <span>{post.reactionCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <IoChatbubble className="w-3 h-3" />
                            <span>{post.commentCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        </button>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'people':
                return (
                    <div>
                        {users.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between px-4 py-2">
                                    <h3 className="font-medium text-gray-900">People</h3>
                                    <button className="text-sm text-blue-500">See all</button>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {users.map(renderUserItem)}
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'posts':
                return (
                    <div>
                        {posts.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between px-4 py-2">
                                    <h3 className="font-medium text-gray-900">Posts</h3>
                                    <button className="text-sm text-blue-500">See all</button>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {posts.map(renderPostItem)}
                                </div>
                            </div>
                        )}
                    </div>
                );
            default:
                return (
                    <div>
                        {users.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between px-4 py-2">
                                    <h3 className="font-medium text-gray-900">People</h3>
                                    <button className="text-sm text-blue-500">See all</button>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {users.slice(0, 3).map(renderUserItem)}
                                </div>
                            </div>
                        )}
                        {posts.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between px-4 py-2">
                                    <h3 className="font-medium text-gray-900">Posts</h3>
                                    <button className="text-sm text-blue-500">See all</button>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {posts.slice(0, 5).map(renderPostItem)}
                                </div>
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="bg-white">
            {/* Search Query Header */}
            <div className="px-4 py-3 border-b border-gray-100">
                <span className="text-lg font-medium text-gray-900">{searchQuery}</span>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => onTabChange ? onTabChange(tab.key) : setLocalActiveTab(tab.key as any)}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                            activeTab === tab.key
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="pb-4">
                {renderContent()}
            </div>
        </div>
    );
};

export default SearchResults;
