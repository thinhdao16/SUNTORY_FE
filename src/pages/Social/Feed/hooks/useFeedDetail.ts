import { useQuery } from 'react-query';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { useSocialFeedStore } from '@/store/zustand/social-feed-store';
import { useEffect } from 'react';

export const useFeedDetail = (postCode: string | null | undefined, enabled: boolean = true) => {
  const { setCurrentPost, clearCurrentPost, currentPost } = useSocialFeedStore();

  useEffect(() => {
    if (postCode) {
      clearCurrentPost();
    }
  }, [postCode, clearCurrentPost]);

  const query = useQuery(
    ['feedDetail', postCode],
    async () => {
      if (!postCode) return null;
      return await SocialFeedService.getPostByCode(postCode);
    },
    {
      enabled: enabled && !!postCode,
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
