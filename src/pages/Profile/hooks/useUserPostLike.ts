import { useMutation, useQueryClient } from 'react-query';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { useToastStore } from '@/store/zustand/toast-store';
import { useTranslation } from 'react-i18next';
import { ProfileTabType } from './useUserPosts';
import { useSearchResultsStore } from '@/store/zustand/search-results-store';
import { useProfilePostsStore } from '@/store/zustand/profile-posts-store';

interface UseUserPostLikeParams {
  tabType: ProfileTabType;
  targetUserId?: number;
}

export const useUserPostLike = ({ tabType, targetUserId }: UseUserPostLikeParams) => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const { t } = useTranslation();

  return useMutation(
    async ({ postCode, isLiked }: { postCode: string; isLiked: boolean }) => {
      if (isLiked) {
        await SocialFeedService.unlikePost(postCode);
      } else {
        await SocialFeedService.likePost(postCode, false);
      }
      return { postCode, isLiked };
    },
    {
      onMutate: async ({ postCode }) => {
        // Optimistic UI: toggle instantly in profile store only
        try { useProfilePostsStore.getState().optimisticUpdatePostReaction(postCode); } catch {}
        return {};
      },
      onError: (err, variables) => {
        // Rollback store by toggling back
        try { useProfilePostsStore.getState().optimisticUpdatePostReaction(variables.postCode); } catch {}
        // Also rollback optimistic change in Search store if any
        try { useSearchResultsStore.getState().optimisticUpdatePostReaction(variables.postCode); } catch {}
      },
      onSuccess: async ({ postCode }) => {
        // Fetch exact values once, then sync store and caches
        try {
          const fresh = await SocialFeedService.getPostByCode(postCode);
          // Update profile posts store with exact values
          try { useProfilePostsStore.getState().updatePostReaction(fresh.code, fresh.isLike, fresh.reactionCount); } catch {}
          // Sync all userPosts caches (if other views are open)
          const matches = queryClient.getQueriesData(['userPosts']);
          matches.forEach(([key]) => {
            queryClient.setQueryData(key as any, (old: any) => {
              if (!old?.pages) return old;
              const updatedPages = old.pages.map((page: any) => {
                if (!page?.data?.data) return page;
                const list = page.data.data as any[];
                const idx = list.findIndex((p: any) => p.code === postCode);
                if (idx === -1) return page;
                const next = [...list];
                next[idx] = {
                  ...next[idx],
                  isLike: fresh.isLike,
                  reactionCount: fresh.reactionCount,
                };
                return { ...page, data: { ...page.data, data: next } };
              });
              return { ...old, pages: updatedPages };
            });
          });
        } catch {}
      },
      onSettled: () => {
        // queryClient.invalidateQueries(['userPosts', tabType, targetUserId]);
      }
    }
  );
};
