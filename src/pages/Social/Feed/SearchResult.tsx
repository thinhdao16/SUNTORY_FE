import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { useSearch } from '@/hooks/useSearch';
import SearchResults from '@/components/social/SearchResults';
import { useSaveSearchHistory } from '@/hooks/useSearchQueries';
import SearchIcon from "@/icons/logo/social-chat/search.svg?react"
import ClearInputIcon from '@/icons/logo/social-chat/clear-input.svg?react';
import BackIcon from "@/icons/logo/back-default.svg?react"
import { useSocialFeedStore } from '@/store/zustand/social-feed-store';
import { useScrollRestoration } from '@/pages/Social/Feed/hooks/useScrollRestoration';


interface SearchResultParams {
    feedId?: string;
}

const SearchResult: React.FC = () => {
    const { t } = useTranslation();
    const { feedId: tab } = useParams<SearchResultParams>();
    const location = useLocation();
    const history = useHistory();
    const { setCurrentPost } = useSocialFeedStore();
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

    const { setScrollContainer } = useScrollRestoration({
        hashtagNormalized: `search:${tab || 'all'}:${queryFromUrl.trim()}`,
        enabled: true
    });
    const containerRef = useRef<HTMLDivElement>(null);


    const [inputValue, setInputValue] = useState(queryFromUrl);

    const saveHistoryMutation = useSaveSearchHistory();
    const hasSearched = useRef(false);


    const handleUserClick = (user: any) => {
        saveHistoryMutation.mutate({
            searchText: '',
            targetUserId: user.id
        });
        history.push(`/profile/${user.id}`);
    };

    const handlePostClick = (post: any) => {
        setCurrentPost(post);
        history.push(`/social-feed/f/${post.code}`);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleInputSubmit = () => {
        if (inputValue.trim()) {
            const trimmedInput = inputValue.trim();
            const isHashtag = trimmedInput.startsWith('#');
            const searchParams = isHashtag ? { searchText: '', hashtagText: trimmedInput.substring(1) } : { searchText: trimmedInput };
            saveHistoryMutation.mutate(searchParams);
            setSearchQuery(trimmedInput);
            const targetPath = `/social-feed/search-result/${tab || 'all'}?q=${encodeURIComponent(trimmedInput)}`;
            const currentPath = `${location.pathname}${location.search}`;
            if (currentPath !== targetPath) {
                history.replace(targetPath);
            }
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
        history.goBack();
    };
    
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
            handleInputSubmit();
        }
    }, [searchQuery, handleSearchSubmit]);

    useEffect(() => {
        setScrollContainer(containerRef.current as unknown as HTMLElement | null);
    }, [setScrollContainer]);

    return (
        <div className="bg-white min-h-screen flex flex-col " ref={containerRef}>

            <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200  ">
                <button
                    onClick={handleBackClick}
                    className="pr-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <BackIcon className="text-xl text-gray-600" />
                </button>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleInputFocus()
                    }}
                    className="flex items-center flex-grow bg-chat-to rounded-lg px-4 py-2 gap-2 relative"
                >
                    <SearchIcon
                        className="text-gray-400 text-lg"
                    />
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        // onFocus={handleInputFocus}
                        onClick={() => {
                            const q = (inputValue || queryFromUrl).trim();
                            if (q) {
                                history.push(`/social-feed/search?q=${encodeURIComponent(q)}`);
                            } else {
                                history.push('/social-feed/search');
                            }
                        }}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const q = (inputValue || queryFromUrl).trim();
                                if (q) {
                                    history.push(`/social-feed/search?q=${encodeURIComponent(q)}`);
                                } else {
                                    history.push('/social-feed/search');
                                }
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
            {/* Tab header is handled within SearchResults */}
            <SearchResults
                searchQuery={searchQuery}
                activeTab={tab || 'all'}
                onUserClick={handleUserClick}
                onPostClick={handlePostClick}
            />

        </div>
    );
};

export default SearchResult;
