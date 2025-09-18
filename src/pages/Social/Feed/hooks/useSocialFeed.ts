import { useInfiniteQuery } from 'react-query';
import { useEffect } from 'react';
import { SocialPost } from '@/types/social-feed';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { useSocialFeedStore, generateFeedKey } from '@/store/zustand/social-feed-store';

interface UseSocialFeedQueryOptions {
  pageSize?: number;
  privacy?: number;
  enabled?: boolean;
}

interface UseSocialFeedOptions {
  pageSize?: number;
  feedType?: number;
  hashtagNormalized?: string;
  enabled?: boolean;
}

export const useSocialFeedQuery = (options: UseSocialFeedQueryOptions = {}) => {
  const { pageSize = 10, privacy, enabled = true } = options;

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useInfiniteQuery(
    ['socialFeedPosts', { privacy, pageSize }],
    ({ pageParam = 0 }) =>
      SocialFeedService.getPostsInfinite(pageParam, pageSize, privacy),
    {
      enabled,
      getNextPageParam: (lastPage, pages) => {
        if (!lastPage?.data) return undefined;
        const { nextPage, pageNumber } = lastPage.data;
        if (nextPage === false) {
          return undefined;
        }
        return pageNumber + 1;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    }
  );

  const posts: SocialPost[] = data?.pages?.flatMap(page => page.data?.data || []) || [];

  return {
    posts,
    error,
    isLoading,
    isError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  };
};

export const useSocialFeed = (options: UseSocialFeedOptions = {}) => {
  const { pageSize = 20, feedType, hashtagNormalized, enabled = true } = options;

  const {
    getFeedPosts,
    setFeedPosts,
    appendFeedPosts,
    setFeedParams,
    setFeedLoading,
    setActiveFeedKey
  } = useSocialFeedStore();

  // Generate feed key for caching
  const feedKey = generateFeedKey(feedType, hashtagNormalized);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useInfiniteQuery(
    ['socialFeed', { feedType, hashtagNormalized, pageSize }],
    ({ pageParam }) =>
      SocialFeedService.getFeedWithLastPostCode(pageParam, pageSize, feedType, hashtagNormalized),
    {
      enabled,
      getNextPageParam: (lastPage, pages) => {
        if (!lastPage?.data) return undefined;
        
        if (lastPage.data.length === 0) {
          return undefined;
        }
        
        const lastPost = lastPage.data[lastPage.data.length - 1];
        return lastPost?.code || undefined;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      onSuccess: (data) => {
        const allPosts = data?.pages?.flatMap(page => page.data || []) || [];
        console.log(data)
        if (data?.pages?.length === 1) {
          setFeedPosts(allPosts, feedKey);
        } else if (data?.pages && data.pages.length > 1) {
          const latestPage = data.pages[data.pages.length - 1];
          const latestPageData = latestPage?.data || [];
          if (latestPageData.length > 0) {
            appendFeedPosts(latestPageData, feedKey);
          }
        }
        
        setFeedParams({ feedType, hashtagNormalized, pageSize });
      }
    }
  );

  // Set active feed key when feedType or hashtag changes
  useEffect(() => {
    setActiveFeedKey(feedKey);
  }, [feedKey, setActiveFeedKey]);

  useEffect(() => {
    setFeedLoading(isLoading);
  }, [isLoading, setFeedLoading]);


  const posts: SocialPost[] = data?.pages?.flatMap(page => page.data || []) || [];
  const cachedPosts = getFeedPosts(feedKey);
  
  return {
    posts: cachedPosts.length > 0 ? cachedPosts : posts,
    error,
    isLoading,
    isError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  };
};
