import React, { useState, useCallback, useRef } from 'react';
import { useDebounce } from './useDebounce';
import { useSearchUsers, usePerformSearch, useSaveSearchHistory } from './useSearchQueries';
import { SearchUser, SearchPost } from '@/services/social/search-service';

interface UseSearchOptions {
    onSearchSubmit?: (query: string) => void;
    activeTab?: string;
    shouldSaveHistory?: boolean;
}

export const useSearch = ({ onSearchSubmit, activeTab = 'all', shouldSaveHistory = false }: UseSearchOptions = {}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<{
        users: SearchUser[];
        posts: SearchPost[];
    }>({ users: [], posts: [] });

    const debouncedQuery = useDebounce(searchQuery, 300);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const { data: userSuggestions, isLoading: isLoadingUsers } = useSearchUsers(
        debouncedQuery, 1, 5, debouncedQuery?.length > 0
    );
    
    const performSearchMutation = usePerformSearch();
    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
        if (value.length === 0) {
            setSearchResults({ users: [], posts: [] });
            setIsSearching(false);
        }
    }, []);

    const handleSearchSubmit = useCallback(async () => {
        if (!searchQuery.trim()) {
            return;
        }
        try {
            const trimmedQuery = searchQuery.trim();
            
            const isHashtag = trimmedQuery.startsWith('#');
            const searchParams = isHashtag 
                ? { searchText: '', hashtagText: trimmedQuery.substring(1) }
                : { searchText: trimmedQuery };
            
            const result = await performSearchMutation.mutateAsync({ 
                searchQuery: trimmedQuery,
                activeTab,
                shouldSaveHistory,
                ...searchParams
            });
            setSearchResults({
                users: result?.users || [],
                posts: result?.posts || []
            });
            onSearchSubmit?.(searchQuery);
        } catch (error) {
        }
    }, [searchQuery, onSearchSubmit, performSearchMutation, activeTab, shouldSaveHistory]);

    const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSearchSubmit();
        }
    }, [handleSearchSubmit]);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setSearchResults({ users: [], posts: [] });
        setIsSearching(false);
    }, []);

    const focusSearch = useCallback(() => {
        searchInputRef.current?.focus();
    }, []);

    return {
        searchQuery,
        setSearchQuery: handleSearchChange,
        userSuggestions: userSuggestions || [],
        searchResults,
        isLoadingUsers,
        isSearching: performSearchMutation.isLoading,
        handleSearchSubmit,
        handleKeyPress,
        clearSearch,
        focusSearch,
        searchInputRef,
        hasQuery: searchQuery?.length > 0,
        hasSuggestions: (userSuggestions?.length || 0) > 0,
        hasResults: (searchResults?.users?.length || 0) > 0 || (searchResults?.posts?.length || 0) > 0
    };
};
