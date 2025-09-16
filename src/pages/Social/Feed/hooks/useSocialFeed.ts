import { useInfiniteQuery } from 'react-query';
import { SocialPost } from '@/types/social-feed';
import { SocialFeedService } from '@/services/social/social-feed-service';

interface UseSocialFeedQueryOptions {
  pageSize?: number;
  privacy?: number;
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
