import { useMutation, useQueryClient } from 'react-query';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { useToastStore } from '@/store/zustand/toast-store';
import { useTranslation } from 'react-i18next';
import { ProfileTabType } from './useUserPosts';
import { useSearchResultsStore } from '@/store/zustand/search-results-store';

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
      onMutate: async ({ postCode, isLiked }) => {
        await queryClient.cancelQueries(['userPosts', tabType, targetUserId]);

        const previousData = queryClient.getQueryData(['userPosts', tabType, targetUserId]);
        queryClient.setQueryData(['userPosts', tabType, targetUserId], (old: any) => {
          if (!old?.pages) return old;

          const updatedPages = old.pages.map((page: any) => {
            if (!page.data?.data) return page;
            
            const postIndex = page.data.data.findIndex((post: any) => post.code === postCode);
            if (postIndex === -1) return page;
            
            const updatedPosts = [...page.data.data];
            updatedPosts[postIndex] = {
              ...updatedPosts[postIndex],
              isLike: !isLiked,
              reactionCount: isLiked 
                ? Math.max(0, (updatedPosts[postIndex].reactionCount || 0) - 1)
                : (updatedPosts[postIndex].reactionCount || 0) + 1
            };
            
            return {
              ...page,
              data: {
                ...page.data,
                data: updatedPosts
              }
            };
          });

          return {
            ...old,
            pages: updatedPages
          };
        });

        return { previousData };
      },
      onError: (err, variables, context) => {
        // Rollback to previous data on error
        if (context?.previousData) {
          queryClient.setQueryData(['userPosts', tabType, targetUserId], context.previousData);
        }
        // Also rollback optimistic change in Search store if any
        try { useSearchResultsStore.getState().optimisticUpdatePostReaction(variables.postCode); } catch {}
      },
      onSuccess: async ({ postCode }) => {
        // queryClient.invalidateQueries(['userPosts']);
        // queryClient.invalidateQueries(['socialFeed']);
        // queryClient.invalidateQueries(['social-posts']);
        // queryClient.invalidateQueries(['social-feed']);
        try {
          const fresh = await SocialFeedService.getPostByCode(postCode);
          // Keep feedDetail fresh for any detail views
          queryClient.setQueryData(['feedDetail', postCode], fresh);
          // Update search store too so Search screen reflects immediately
          try { useSearchResultsStore.getState().updatePostReaction(fresh.code, fresh.isLike, fresh.reactionCount); } catch {}
        } catch {}
      },
      onSettled: () => {
        // queryClient.invalidateQueries(['userPosts', tabType, targetUserId]);
      }
    }
  );
};
