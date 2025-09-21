import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import { searchOutline, arrowBackOutline } from 'ionicons/icons';
import { useSearch } from '@/hooks/useSearch';
import SearchSuggestions from '@/components/social/SearchSuggestions';
import SearchResults from '@/components/social/SearchResults';

interface SearchParams {
    tab?: string;
}

const SocialStorySearch: React.FC = () => {
    const { t } = useTranslation();
    const history = useHistory();
    const { tab } = useParams<SearchParams>();
    const location = useLocation();
    
    // Extract query from URL
    const urlParams = new URLSearchParams(location.search);
    const queryFromUrl = urlParams.get('q') || '';
    
    const [showResults, setShowResults] = useState(!!tab);
    const [activeTab, setActiveTab] = useState(tab || 'all');
    
    const {
        searchQuery,
        setSearchQuery,
        userSuggestions,
        searchResults,
        isLoadingUsers,
        isSearching,
        handleSearchSubmit,
        handleKeyPress,
        clearSearch,
        searchInputRef,
        hasQuery,
        hasSuggestions,
        hasResults
    } = useSearch({
        onSearchSubmit: (query: string) => {
            // Navigate to search results with URL
            history.push(`/social-feed/search-result/all?q=${encodeURIComponent(query)}`);
        }
    });
    
    // Initialize search query from URL on component mount
    useEffect(() => {
        if (queryFromUrl && queryFromUrl !== searchQuery) {
            setSearchQuery(queryFromUrl);
            if (tab) {
                // If we have a tab in URL, trigger search
                handleSearchSubmit();
            }
        }
    }, [queryFromUrl, tab]);

    const handleBack = () => {
        if (showResults) {
            // Go back to search input
            history.push('/social-feed/search');
        } else {
            // Navigate back to previous page
            history.goBack();
        }
    };

    const handleClear = () => {
        clearSearch();
        history.push('/social-feed/search');
    };

    const handleSuggestionClick = (username: string) => {
        setSearchQuery(username);
        // Navigate to search results
        history.push(`/social-feed/search-result/all?q=${encodeURIComponent(username)}`);
    };
    
    const handleTabChange = (newTab: string) => {
        setActiveTab(newTab);
        // Update URL with new tab
        history.push(`/social-feed/search-result/${newTab}?q=${encodeURIComponent(searchQuery)}`);
    };

    return (
        <div className="bg-white min-h-screen">
            {/* Search Header */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200">
                <button 
                    onClick={handleBack}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <IonIcon icon={arrowBackOutline} className="text-xl text-gray-600" />
                </button>
                
                <div className="flex items-center flex-grow bg-chat-to rounded-lg px-4 py-2 gap-2">
                    <IonIcon 
                        icon={searchOutline} 
                        className="text-gray-400 text-lg"
                    />
                    <input
                        ref={searchInputRef}
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={t('Search for people and posts...')}
                        className="bg-transparent outline-none flex-grow"
                        autoFocus
                    />
                    {hasQuery && (
                        <button
                            onClick={handleClear}
                            className="text-gray-400 hover:text-gray-600 text-lg"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {/* Search Content */}
            <div className="flex-1">
                {!showResults ? (
                    /* Show suggestions when not showing full results */
                    hasQuery ? (
                        <SearchSuggestions
                            users={userSuggestions}
                            isLoading={isLoadingUsers}
                            onUserSelect={(user) => handleSuggestionClick(user.username)}
                        />
                    ) : (
                        /* Empty state when no query */
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <IonIcon icon={searchOutline} className="text-3xl text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('Search WayJet')}</h3>
                            <p className="text-gray-500 text-center text-sm leading-relaxed">
                                {t('Find people, posts, and discover new content')}
                            </p>
                        </div>
                    )
                ) : (
                    /* Show full search results */
                    <SearchResults
                        users={searchResults.users}
                        posts={searchResults.posts}
                        searchQuery={searchQuery}
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                        onUserClick={(user) => console.log('User clicked:', user)}
                        onPostClick={(post) => console.log('Post clicked:', post)}
                    />
                )}
            </div>
        </div>
    );
};

export default SocialStorySearch;
