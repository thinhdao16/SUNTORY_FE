import { useState, useCallback, useRef, useEffect } from 'react';
import { SearchService } from '@/services/social/search-service';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { SearchUser, SearchPost } from '@/services/social/search-service';
import { SocialPost } from '@/types/social-feed';

interface UseInfiniteSearchOptions {
    searchQuery: string;
    activeTab: string;
    pageSize?: number;
}

export const useInfiniteSearch = ({ 
    searchQuery, 
    activeTab, 
    pageSize = 20 
}: UseInfiniteSearchOptions) => {
    const [users, setUsers] = useState<SearchUser[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(0);
    const [lastPostCode, setLastPostCode] = useState<string | undefined>(undefined);

    const isInitialLoad = useRef(true);

    const resetData = useCallback(() => {
        setUsers([]);
        setPosts([]);
        setCurrentPage(0);
        setLastPostCode(undefined);
        setHasMore(true);
        setError(null);
        isInitialLoad.current = true;
    }, []);

    const loadMoreData = useCallback(async () => {
        if (isLoading || !hasMore || !searchQuery.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            let newUsers: SearchUser[] = [];
            let newPosts: any[] = [];

            switch (activeTab) {
                case 'people':
                    const usersResponse = await SearchService.searchUsers(
                        searchQuery, 
                        currentPage, 
                        pageSize
                    );
                    newUsers = usersResponse.data.data || [];
                    
                    if (isInitialLoad.current) {
                        setUsers(newUsers);
                    } else {
                        setUsers(prev => [...prev, ...newUsers]);
                    }
                    
                    setHasMore(newUsers.length === pageSize);
                    setCurrentPage(prev => prev + 1);
                    break;

                case 'posts':
                    const postsResponse = await SearchService.searchPosts(
                        searchQuery, 
                        currentPage, 
                        pageSize
                    );
                    newPosts = postsResponse.data.data || [];
                    
                    if (isInitialLoad.current) {
                        setPosts(newPosts);
                    } else {
                        setPosts(prev => [...prev, ...newPosts]);
                    }
                    
                    setHasMore(newPosts.length === pageSize);
                    setCurrentPage(prev => prev + 1);
                    break;

                case 'latest':
                    // Use feed API with lastPostCode pagination
                    const feedResponse = await SocialFeedService.getFeedWithLastPostCode(
                        lastPostCode,
                        pageSize,
                        30, // feedType for search
                        searchQuery.startsWith('#') ? searchQuery.substring(1) : undefined
                    );
                    newPosts = feedResponse.data || [];
                    
                    if (isInitialLoad.current) {
                        setPosts(newPosts);
                    } else {
                        setPosts(prev => [...prev, ...newPosts]);
                    }
                    
                    // Update lastPostCode for next load
                    if (newPosts.length > 0) {
                        setLastPostCode(newPosts[newPosts.length - 1].code);
                    }
                    
                    setHasMore(newPosts.length === pageSize);
                    break;

                case 'all':
                default:
                    // Load both users and posts
                    const [allUsersResponse, allPostsResponse] = await Promise.all([
                        SearchService.searchUsers(searchQuery, currentPage, Math.floor(pageSize / 2)),
                        SearchService.searchPosts(searchQuery, currentPage, Math.floor(pageSize / 2))
                    ]);
                    
                    newUsers = allUsersResponse.data.data || [];
                    newPosts = allPostsResponse.data.data || [];
                    
                    if (isInitialLoad.current) {
                        setUsers(newUsers);
                        setPosts(newPosts);
                    } else {
                        setUsers(prev => [...prev, ...newUsers]);
                        setPosts(prev => [...prev, ...newPosts]);
                    }
                    
                    setHasMore(newUsers.length + newPosts.length === pageSize);
                    setCurrentPage(prev => prev + 1);
                    break;
            }

            isInitialLoad.current = false;
        } catch (err) {
            console.error('Error loading more data:', err);
            setError('Failed to load more data');
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, activeTab, currentPage, lastPostCode, pageSize, isLoading, hasMore]);

    // Reset data when search query or tab changes
    useEffect(() => {
        resetData();
    }, [searchQuery, activeTab, resetData]);

    // Load initial data
    useEffect(() => {
        if (searchQuery.trim() && isInitialLoad.current) {
            loadMoreData();
        }
    }, [searchQuery, activeTab]);

    return {
        users,
        posts,
        isLoading,
        hasMore,
        error,
        loadMoreData,
        resetData
    };
};
