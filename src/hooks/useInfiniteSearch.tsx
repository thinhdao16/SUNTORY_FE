import { useCallback, useEffect } from 'react';
import { SearchService } from '@/services/social/search-service';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { SearchUser } from '@/services/social/search-service';
import { useSearchResultsStore, generateSearchKey, SearchTab, SearchResultsTabState } from '@/store/zustand/search-results-store';
import { FeedType } from '@/constants/socialChat';

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
    const tab = (activeTab as SearchTab) || 'all';
    const key = generateSearchKey(tab, searchQuery);

    const tabState = useSearchResultsStore(useCallback((s) => s.cached[key] as SearchResultsTabState | undefined, [key]));
    const ensureKey = useSearchResultsStore(s => s.ensureKey);
    const replaceUsers = useSearchResultsStore(s => s.replaceUsers);
    const appendUsers = useSearchResultsStore(s => s.appendUsers);
    const replacePosts = useSearchResultsStore(s => s.replacePosts);
    const appendPosts = useSearchResultsStore(s => s.appendPosts);
    const setHasMore = useSearchResultsStore(s => s.setHasMore);
    const setCurrentPage = useSearchResultsStore(s => s.setCurrentPage);
    const setLastPostCode = useSearchResultsStore(s => s.setLastPostCode);
    const setLoading = useSearchResultsStore(s => s.setLoading);
    const setError = useSearchResultsStore(s => s.setError);

    const loadMoreData = useCallback(async () => {
        const q = searchQuery.trim();
        const local = tabState;
        if (!q) return;
        if (local?.isLoading || local?.hasMore === false) return;

        setLoading(key, true);
        setError(key, null);

        try {
            let newUsers: SearchUser[] = [];
            let newPosts: any[] = [];

            switch (tab) {
                case 'people':
                    const usersResponse = await SearchService.searchUsers(
                        q, 
                        (local?.currentPage ?? 0), 
                        pageSize
                    );
                    newUsers = usersResponse.data.data || [];
                    
                    if ((local?.currentPage ?? 0) === 0) {
                        replaceUsers(key, newUsers);
                    } else {
                        appendUsers(key, newUsers);
                    }
                    
                    setHasMore(key, newUsers.length === pageSize);
                    setCurrentPage(key, (local?.currentPage ?? 0) + 1);
                    break;

                case 'latest':
                    const postsResponse = await SearchService.searchPosts(
                        q, 
                        (local?.currentPage ?? 0), 
                        pageSize
                    );
                    newPosts = postsResponse.data.data || [];
                    
                    if ((local?.currentPage ?? 0) === 0) {
                        replacePosts(key, newPosts);
                    } else {
                        appendPosts(key, newPosts);
                    }
                    
                    setHasMore(key, newPosts.length === pageSize);
                    setCurrentPage(key, (local?.currentPage ?? 0) + 1);
                    break;

                case 'posts':
                    {
                        const isHashtag = q.startsWith('#');
                        const feedResponse = await SocialFeedService.getFeedWithLastPostCode(
                            local?.lastPostCode,
                            pageSize,
                            isHashtag ? FeedType.Hashtag : FeedType.Everyone,
                            isHashtag ? q.substring(1) : undefined,
                            !isHashtag ? q : undefined
                        );
                    newPosts = feedResponse.data || [];
                    }
                    
                    if ((local?.currentPage ?? 0) === 0 && (local?.posts?.length ?? 0) === 0) {
                        replacePosts(key, newPosts);
                    } else {
                        appendPosts(key, newPosts);
                    }
                    if (newPosts.length > 0) {
                        setLastPostCode(key, newPosts[newPosts.length - 1].code);
                    }
                    
                    setHasMore(key, newPosts.length === pageSize);
                    break;

                case 'all':
                default:
                    // Load both users and posts. Prioritize showing full posts page size.
                    {
                        const usersPageSize = Math.max(1, Math.floor(pageSize / 2)); // e.g. 10 when pageSize=20
                        const postsPageSize = pageSize; // show full page of posts
                        const [allUsersResponse, allPostsResponse] = await Promise.all([
                            SearchService.searchUsers(q, (local?.currentPage ?? 0), usersPageSize),
                            SearchService.searchPosts(q, (local?.currentPage ?? 0), postsPageSize)
                        ]);

                        newUsers = allUsersResponse.data.data || [];
                        newPosts = allPostsResponse.data.data || [];

                        if ((local?.currentPage ?? 0) === 0) {
                            replaceUsers(key, newUsers);
                            replacePosts(key, newPosts);
                        } else {
                            appendUsers(key, newUsers);
                            appendPosts(key, newPosts);
                        }

                        // hasMore if either list still has more pages
                        setHasMore(key, (newPosts.length === postsPageSize) || (newUsers.length === usersPageSize));
                        setCurrentPage(key, (local?.currentPage ?? 0) + 1);
                    }
                    break;
            }
        } catch (err) {
            console.error('Error loading more data:', err);
            setError(key, 'Failed to load more data');
        } finally {
            setLoading(key, false);
        }
    }, [searchQuery, tab, pageSize, tabState?.isLoading, tabState?.hasMore, tabState?.currentPage, tabState?.lastPostCode, key]);

    useEffect(() => {
        ensureKey(key);
    }, [key, ensureKey]);

    useEffect(() => {
        const q = searchQuery.trim();
        if (!q) return;
        if (tabState?.isLoading) return;
        const emptyUsers = (tabState?.users?.length ?? 0) === 0;
        const emptyPosts = (tabState?.posts?.length ?? 0) === 0;
        if (emptyUsers && emptyPosts) {
            loadMoreData();
        }
    }, [key, tabState?.isLoading, tabState?.users?.length, tabState?.posts?.length, loadMoreData, searchQuery]);

    return {
        users: tabState?.users || [],
        posts: tabState?.posts || [],
        isLoading: tabState?.isLoading || false,
        hasMore: tabState?.hasMore ?? true,
        error: tabState?.error || null,
        loadMoreData,
        resetData: () => {
            replaceUsers(key, []);
            replacePosts(key, []);
            setCurrentPage(key, 0);
            setLastPostCode(key, undefined);
            setHasMore(key, true);
            setError(key, null);
        }
    };
}
