import { useQuery } from 'react-query';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { useSocialFeedStore } from '@/store/zustand/social-feed-store';
import { useEffect } from 'react';

export const useFeedDetail = (postId: number | null, enabled: boolean = true) => {
  const { setCurrentPost, clearCurrentPost } = useSocialFeedStore();

  useEffect(() => {
    if (postId) {
      clearCurrentPost();
    }
  }, [postId, clearCurrentPost]);

  const query = useQuery(
    ['feedDetail', postId],
    async () => {
      if (!postId) return null;
      return await SocialFeedService.getPostById(postId);
    },
    {
      enabled: enabled && !!postId,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      onSuccess: (data) => {
        if (data) {
          setCurrentPost(data);
        }
      }
    }
  );

  return {
    ...query,
    post: query.data,
    isLoadingPost: query.isLoading,
    postError: query.error
  };
};
