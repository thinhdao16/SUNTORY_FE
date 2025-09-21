import { useCallback, useEffect } from 'react';
import { useSocialFeedStore } from '@/store/zustand/social-feed-store';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { SocialPost } from '@/types/social-feed';

interface UseSocialFeedWithStoreOptions {
  feedType?: number;
  hashtagNormalized?: string;
  pageSize?: number;
  autoLoad?: boolean;
}

export const useSocialFeedWithStore = (options: UseSocialFeedWithStoreOptions = {}) => {
  const {
    feedType,
    hashtagNormalized,
    pageSize = 20,
    autoLoad = true
  } = options;

  const {
    cachedFeeds,
    activeFeedKey,
    feedParams,
    isLoadingFeed,
    isLoadingMore,
    feedError,
    getFeedPosts,
    setFeedPosts,
    appendFeedPosts,
    clearFeedPosts,
    setFeedParams,
    setFeedLoading,
    setLoadingMore,
    setFeedError,
    setPaginationInfo,
    setActiveFeedKey,
    resetFeedState,
    updatePostReaction,
    optimisticUpdatePostReaction
  } = useSocialFeedStore();

  // Get current feed data
  const currentFeed = cachedFeeds[activeFeedKey] || { posts: [], currentPage: 0, hasNextPage: true, totalPages: 0, totalRecords: 0 };
  const feedPosts = currentFeed.posts;
  const currentPage = currentFeed.currentPage;
  const hasNextPage = currentFeed.hasNextPage;
  const totalPages = currentFeed.totalPages;
  const totalRecords = currentFeed.totalRecords;

  // Load initial feed data
  const loadFeed = useCallback(async (reset = false) => {
    try {
      if (reset) {
        resetFeedState();
      }
      
      setFeedLoading(true);
      setFeedError(null);

      const params = {
        feedType,
        hashtagNormalized,
        pageNumber: reset ? 0 : currentPage,
        pageSize
      };

      const response = await SocialFeedService.getFeed(params);
      
      if (response.data) {
        const posts = response.data.data || [];
        
        if (reset) {
          setFeedPosts(posts);
        } else {
          appendFeedPosts(posts);
        }

        setPaginationInfo({
          currentPage: response.data.pageNumber,
          hasNextPage: response.data.nextPage,
          totalPages: response.data.totalPages,
          totalRecords: response.data.totalRecords
        });

        setFeedParams({ feedType, hashtagNormalized, pageSize });
      }
    } catch (error: any) {
      console.error('Failed to load feed:', error);
      setFeedError(error.message || 'Failed to load feed');
    } finally {
      setFeedLoading(false);
    }
  }, [
    feedType,
    hashtagNormalized,
    pageSize,
    currentPage,
    setFeedPosts,
    appendFeedPosts,
    setFeedLoading,
    setFeedError,
    setPaginationInfo,
    setFeedParams,
    resetFeedState
  ]);

  // Load more posts (pagination)
  const loadMore = useCallback(async () => {
    if (!hasNextPage || isLoadingMore) return;

    try {
      setLoadingMore(true);
      setFeedError(null);

      const params = {
        feedType,
        hashtagNormalized,
        pageNumber: currentPage + 1,
        pageSize
      };

      const response = await SocialFeedService.getFeed(params);
      
      if (response.data) {
        const posts = response.data.data || [];
        appendFeedPosts(posts);

        setPaginationInfo({
          currentPage: response.data.pageNumber,
          hasNextPage: response.data.nextPage,
          totalPages: response.data.totalPages,
          totalRecords: response.data.totalRecords
        });
      }
    } catch (error: any) {
      console.error('Failed to load more posts:', error);
      setFeedError(error.message || 'Failed to load more posts');
    } finally {
      setLoadingMore(false);
    }
  }, [
    feedType,
    hashtagNormalized,
    pageSize,
    currentPage,
    hasNextPage,
    isLoadingMore,
    appendFeedPosts,
    setLoadingMore,
    setFeedError,
    setPaginationInfo
  ]);

  // Refresh feed
  const refresh = useCallback(() => {
    return loadFeed(true);
  }, [loadFeed]);

  // Handle post like/unlike
  const handleLike = useCallback(async (postCode: string) => {
    const post = feedPosts.find((p: any) => p.code === postCode);
    if (!post) return;

    // Optimistic update
    optimisticUpdatePostReaction(postCode);

    try {
      await SocialFeedService.likePost(postCode, post.isLike);
      // The optimistic update will remain if successful
    } catch (error) {
      console.error('Failed to like/unlike post:', error);
      // Revert optimistic update on error
      optimisticUpdatePostReaction(postCode);
    }
  }, [feedPosts, optimisticUpdatePostReaction]);

  // Auto-load on mount or when parameters change
  useEffect(() => {
    if (autoLoad) {
      loadFeed(true);
    }
  }, [feedType, hashtagNormalized, pageSize, autoLoad, loadFeed]);

  return {
    // Data
    posts: feedPosts,
    currentPage,
    hasNextPage,
    totalPages,
    totalRecords,
    
    // Loading states
    isLoading: isLoadingFeed,
    isLoadingMore,
    
    // Error state
    error: feedError,
    
    // Actions
    loadFeed: () => loadFeed(true),
    loadMore,
    refresh,
    handleLike,
    clearFeed: clearFeedPosts,
    
    // Store actions (for advanced usage)
    updatePostReaction,
    optimisticUpdatePostReaction
  };
};
