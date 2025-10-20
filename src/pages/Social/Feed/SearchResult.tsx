import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { useSearch } from '@/hooks/useSearch';
import SearchResults from '@/components/social/SearchResults';
import { useSaveSearchHistory } from '@/hooks/useSearchQueries';
import BackInputIcon from "@/icons/logo/social-chat/back-input.svg?react"
import SearchIcon from "@/icons/logo/social-chat/search.svg?react"
import ClearInputIcon from '@/icons/logo/social-chat/clear-input.svg?react';
import BackIcon from "@/icons/logo/back-default.svg?react"


interface SearchResultParams {
    feedId?: string;
}

const SearchResult: React.FC = () => {
    const tabs = [
        { key: 'all', label: t('All') },
        { key: 'latest', label: t('Latest') },
        { key: 'people', label: t('People') },
        { key: 'posts', label: t('Posts') }
    ];
    const { feedId: tab } = useParams<SearchResultParams>();
    const location = useLocation();
    const history = useHistory();

    const urlParams = new URLSearchParams(location.search);
    const queryFromUrl = urlParams.get('q') || '';
    const {
        searchQuery,
        setSearchQuery,
        searchResults,
        isSearching,
        handleSearchSubmit
    } = useSearch({
        onSearchSubmit: (query: string) => {
        },
        activeTab: tab || 'all',
        shouldSaveHistory: false
    });

    const [inputValue, setInputValue] = useState(queryFromUrl);
    const saveHistoryMutation = useSaveSearchHistory();
    const hasSearched = useRef(false);

    useEffect(() => {
        if (queryFromUrl && queryFromUrl !== searchQuery) {
            setSearchQuery(queryFromUrl);
            setInputValue(queryFromUrl);
            hasSearched.current = false;
        }
    }, [queryFromUrl]);

    useEffect(() => {
        if (searchQuery && searchQuery.trim() && !hasSearched.current) {
            hasSearched.current = true;
            handleSearchSubmit();
        }
    }, [searchQuery, handleSearchSubmit]);

    const handleTabChange = (newTab: string) => {
        hasSearched.current = false;
        history.push(`/social-feed/search-result/${newTab}?q=${encodeURIComponent(searchQuery)}`);
    };

    const handleUserClick = (user: any) => {
        saveHistoryMutation.mutate({
            searchText: '',
            targetUserId: user.id
        });
        history.push(`/profile/${user.id}`);
    };

    const handlePostClick = (post: any) => {
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleInputSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            const trimmedInput = inputValue.trim();

            const isHashtag = trimmedInput.startsWith('#');
            const searchParams = isHashtag
                ? { searchText: '', hashtagText: trimmedInput.substring(1) }
                : { searchText: trimmedInput };

            saveHistoryMutation.mutate(searchParams);

            setSearchQuery(trimmedInput);
            history.push(`/social-feed/search-result/${tab || 'all'}?q=${encodeURIComponent(trimmedInput)}`);
            setTimeout(() => {
                handleSearchSubmit();
            }, 100);
        }
    };

    const handleClearInput = () => {
        setInputValue('');
        setSearchQuery('');
        history.push('/social-feed/search');
    };

    const handleInputFocus = () => {
        const currentQuery = inputValue || queryFromUrl;
        if (currentQuery) {
            history.push(`/social-feed/search?q=${encodeURIComponent(currentQuery)}`);
        } else {
            history.push('/social-feed/search');
        }
    };

    const handleBackClick = () => {
        history.push('/social-feed/search');
    };

    return (
        <div className="bg-white min-h-screen flex flex-col ">

            <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200  ">
                <button
                    onClick={handleBackClick}
                    className="pr-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <BackIcon className="text-xl text-gray-600" />
                </button>

                <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(); }} className="flex items-center flex-grow bg-chat-to rounded-lg px-4 py-2 gap-2 relative">
                    <SearchIcon
                        className="text-gray-400 text-lg"
                    />
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        // onFocus={handleInputFocus}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleInputSubmit(e as any);
                            }
                        }}
                        placeholder={t('Search for people and posts...')}
                        className="bg-transparent outline-none flex-grow z-1"
                        autoFocus
                        readOnly
                    />
                    {inputValue && (
                        <button
                            type="button"
                            onClick={handleClearInput}
                            className="text-gray-400 hover:text-gray-600 text-lg absolute right-4 z-99 bg-chat-to"
                        >
                            <ClearInputIcon className="text-xl text-gray-600" />
                        </button>
                    )}
                </form>

            </div>
            <div className="flex border-b border-gray-100 flex-shrink-0 sticky top-16 z-10 bg-white pt-2">
                {tabs.map((tabItem) => (
                    <button
                        key={tabItem.key}
                        onClick={() => handleTabChange(tabItem.key)}
                        className={`flex-1 py-3 px-4 text-sm transition-colors font-semibold flex justify-center ${(tab || 'all') === tabItem.key
                            ? 'text-black'
                            : 'text-netural-300'
                            }`}
                    >
                        <span className="relative">
                            {tabItem.label}
                            {(tab || 'all') === tabItem.key && (
                                <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-black rounded-full"></div>
                            )}
                        </span>
                    </button>
                ))}
            </div>
            <SearchResults
                searchQuery={searchQuery}
                activeTab={tab || 'all'}
                onTabChange={handleTabChange}
                onUserClick={handleUserClick}
                onPostClick={handlePostClick}
            />

        </div>
    );
};

export default SearchResult;
