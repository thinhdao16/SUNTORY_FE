import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { searchOutline, arrowBackOutline } from 'ionicons/icons';
import { useSearch } from '@/hooks/useSearch';
import SearchSuggestions from '@/components/social/SearchSuggestions';
import SearchHistory from '@/components/social/SearchHistory';
import { useSaveSearchHistory, useSearchHistories } from '@/hooks/useSearchQueries';
import BackIcon from "@/icons/logo/back-default.svg?react"
import SearchIcon from "@/icons/logo/social-chat/search.svg?react"
import ClearInputIcon from '@/icons/logo/social-chat/clear-input.svg?react';

interface SearchParams {
    tab?: string;
    infoFeed?: string;
}

const SocialStorySearch: React.FC = () => {
    const { t } = useTranslation();
    const history = useHistory();
    const { tab, infoFeed } = useParams<SearchParams>();
    const location = useLocation();
    const urlParams = new URLSearchParams(location.search);
    const queryFromUrl = urlParams.get('q') || '';

    const [showResults, setShowResults] = useState(!!tab);
    const [activeTab, setActiveTab] = useState('all');

    const {
        searchQuery,
        setSearchQuery,
        userSuggestions,
        isLoadingUsers,
        handleKeyPress,
        clearSearch,
        searchInputRef,
        hasQuery,
        hasSuggestions,
        handleSearchSubmit
    } = useSearch({
        onSearchSubmit: (query: string) => {
            history.push(`/social-feed/search-result/all?q=${encodeURIComponent(query)}`);
        },
        shouldSaveHistory: true 
    });

    const saveHistoryMutation = useSaveSearchHistory();
    const { data: histories = [] } = useSearchHistories(0, 20);

    useEffect(() => {
        if (queryFromUrl && queryFromUrl !== searchQuery) {
            setSearchQuery(queryFromUrl);
            if (tab) {
                handleSearchSubmit();
            }
        }
    }, [queryFromUrl, tab]);

    const handleBack = () => {
        // history.push('/social-feed');
        history.goBack()
    };

    const handleClear = () => {
        clearSearch();
        history.push('/social-feed/search');
    };

    const handleSuggestionClick = (username: string) => {
        saveHistoryMutation.mutate({ searchText: username });
        history.push(`/social-feed/search-result/all?q=${encodeURIComponent(username)}`);
    };

    const handleHistoryClick = (keyword: string) => {
        const isHashtag = keyword.startsWith('#');
        const searchParams = isHashtag
            ? { searchText: '', hashtagText: keyword.substring(1) }
            : { searchText: keyword };

        saveHistoryMutation.mutate(searchParams);
        setSearchQuery(keyword);
        history.push(`/social-feed/search-result/all?q=${encodeURIComponent(keyword)}`);
    };

    const handleUserClick = (userId: number) => {
        saveHistoryMutation.mutate({
            searchText: '',
            targetUserId: userId
        });
        history.push(`/profile/${userId}`);
    };

    const handleHashtagClick = (hashtag: string) => {
        const hashtagQuery = `#${hashtag}`;
        saveHistoryMutation.mutate({
            searchText: '',
            hashtagText: hashtag
        });

        setSearchQuery(hashtagQuery);
        history.push(`/social-feed/search-result/all?q=${encodeURIComponent(hashtagQuery)}`);
    };

    const handleTabChange = (newTab: string) => {
        setActiveTab(newTab);
        history.push(`/social-feed/search-result/${newTab}?q=${encodeURIComponent(searchQuery)}`);
    };

    return (
        <div className="bg-white min-h-screen">
            <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200">
                <button
                    onClick={handleBack}
                    className="pr-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <BackIcon className="text-xl text-gray-600" />
                </button>

                <div className="flex items-center flex-grow bg-chat-to rounded-lg px-4 py-2 gap-2 relative">
                    <SearchIcon
                        className="text-gray-400 text-lg"
                    />
                    <input
                        ref={searchInputRef}
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={t('Search for people and posts...')}
                        className="bg-transparent outline-none flex-grow z-1"
                        autoFocus
                    />
                    {hasQuery && (
                        <button
                        type='button'
                            onClick={handleClear}
                            className="text-gray-400 hover:text-gray-600 text-lg absolute right-4 z-99 bg-chat-to"
                        >
                            <ClearInputIcon className="text-xl text-gray-600" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1">
                {!showResults && (
                    hasQuery ? (
                        <SearchSuggestions
                            users={userSuggestions}
                            isLoading={isLoadingUsers}
                            onUserSelect={(userId) => handleUserClick(userId)}
                        />
                    ) : (
                        <div>
                            <SearchHistory
                                onHistoryClick={handleHistoryClick}
                                onUserClick={handleUserClick}
                                onHashtagClick={handleHashtagClick}
                            />
                            {histories.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 px-4">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <SearchIcon className="text-3xl text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('Search WayJet')}</h3>
                                    <p className="text-gray-500 text-center text-sm leading-relaxed">
                                        {t('Find people, posts, and discover new content')}
                                    </p>
                                </div>
                            )}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default SocialStorySearch;
