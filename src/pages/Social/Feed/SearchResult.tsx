import React, { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useSearch } from '@/hooks/useSearch';
import SearchResults from '@/components/social/SearchResults';

interface SearchResultParams {
    feedId?: string; // This will be the tab (all, people, posts, latest)
}

const SearchResult: React.FC = () => {
    const { feedId: tab } = useParams<SearchResultParams>();
    const location = useLocation();
    
    // Extract query from URL
    const urlParams = new URLSearchParams(location.search);
    const queryFromUrl = urlParams.get('q') || '';
    
    const {
        searchQuery,
        setSearchQuery,
        searchResults,
        isSearching,
        handleSearchSubmit
    } = useSearch();
    
    // Initialize search query from URL and trigger search
    useEffect(() => {
        if (queryFromUrl && queryFromUrl !== searchQuery) {
            setSearchQuery(queryFromUrl);
            // Trigger search when component mounts with query
            setTimeout(() => {
                handleSearchSubmit();
            }, 100);
        }
    }, [queryFromUrl]);

    const handleTabChange = (newTab: string) => {
        // This will be handled by the parent component through URL changes
        window.history.pushState(null, '', `/social-feed/search-result/${newTab}?q=${encodeURIComponent(searchQuery)}`);
        window.location.reload(); // Force reload to update the route
    };

    const handleUserClick = (user: any) => {
        console.log('User clicked:', user);
        // TODO: Navigate to user profile
    };

    const handlePostClick = (post: any) => {
        console.log('Post clicked:', post);
        // TODO: Navigate to post detail
    };

    return (
        <div className="bg-white min-h-screen">
            <SearchResults
                users={searchResults.users}
                posts={searchResults.posts}
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
