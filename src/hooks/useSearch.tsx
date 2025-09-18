import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from 'react-query';
import { SearchService, SearchUser, SearchPost } from '@/services/social/search-service';
import { useDebounce } from '@/hooks/useDebounce';

interface UseSearchProps {
    onSearchSubmit?: (query: string) => void;
}

export const useSearch = ({ onSearchSubmit }: UseSearchProps = {}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<{
        users: SearchUser[];
        posts: SearchPost[];
    }>({ users: [], posts: [] });
    
    const debouncedQuery = useDebounce(searchQuery, 300);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Real-time user search for suggestions
    const { data: userSuggestions, isLoading: isLoadingUsers } = useQuery(
        ['searchUsers', debouncedQuery],
        () => SearchService.searchUsers(debouncedQuery, 1, 5),
        {
            enabled: debouncedQuery.length > 0,
            select: (data) => data.data.data,
            staleTime: 30000, // 30 seconds
        }
    );

    // Handle search input change
    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
        if (value.length === 0) {
            setSearchResults({ users: [], posts: [] });
            setIsSearching(false);
        }
    }, []);

    // Handle search submit (Enter key or search button)
    const handleSearchSubmit = useCallback(async () => {
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        try {
            const [usersResponse, postsResponse] = await Promise.all([
                SearchService.searchUsers(searchQuery, 1, 20),
                SearchService.searchPosts(searchQuery, 1, 20)
            ]);

            setSearchResults({
                users: usersResponse.data.data,
                posts: postsResponse.data.data
            });

            onSearchSubmit?.(searchQuery);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery, onSearchSubmit]);

    // Handle Enter key press
    const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSearchSubmit();
        }
    }, [handleSearchSubmit]);

    // Clear search
    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setSearchResults({ users: [], posts: [] });
        setIsSearching(false);
    }, []);

    // Focus search input
    const focusSearch = useCallback(() => {
        searchInputRef.current?.focus();
    }, []);

    return {
        searchQuery,
        setSearchQuery: handleSearchChange,
        userSuggestions: userSuggestions || [],
        searchResults,
        isLoadingUsers,
        isSearching,
        handleSearchSubmit,
        handleKeyPress,
        clearSearch,
        focusSearch,
        searchInputRef,
        hasQuery: searchQuery.length > 0,
        hasSuggestions: (userSuggestions?.length || 0) > 0,
        hasResults: searchResults.users.length > 0 || searchResults.posts.length > 0
    };
};
