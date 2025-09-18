import { useMutation, useQueryClient } from 'react-query';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { useToastStore } from '@/store/zustand/toast-store';
import { useTranslation } from 'react-i18next';
import { ProfileTabType } from './useUserPosts';

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
        // Cancel any outgoing refetches
        await queryClient.cancelQueries(['userPosts', tabType, targetUserId]);

        // Snapshot the previous value
        const previousData = queryClient.getQueryData(['userPosts', tabType, targetUserId]);

        // Optimistically update the cache
        queryClient.setQueryData(['userPosts', tabType, targetUserId], (old: any) => {
          if (!old?.pages) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: {
                ...page.data,
                data: page.data?.data?.map((post: any) => {
                  if (post.code === postCode) {
                    return {
                      ...post,
                      isLike: !isLiked,
                      reactionCount: isLiked 
                        ? Math.max(0, (post.reactionCount || 0) - 1)
                        : (post.reactionCount || 0) + 1
                    };
                  }
                  return post;
                }) || []
              }
            }))
          };
        });

        return { previousData };
      },
      onError: (err, variables, context) => {
        // Rollback to previous data on error
        if (context?.previousData) {
          queryClient.setQueryData(['userPosts', tabType, targetUserId], context.previousData);
        }
      },
      onSuccess: () => {
        // Invalidate ALL userPosts queries to ensure consistency across all tabs
        queryClient.invalidateQueries(['userPosts']);
        
        // Also invalidate social feed queries
        queryClient.invalidateQueries(['socialFeed']);
        queryClient.invalidateQueries(['social-posts']);
        queryClient.invalidateQueries(['social-feed']);
        
        showToast(t('Post liked successfully!'), 2000, 'success');
      },
      onSettled: () => {
        // Invalidate and refetch to ensure consistency
        queryClient.invalidateQueries(['userPosts', tabType, targetUserId]);
      }
    }
  );
};
