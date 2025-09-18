import { useMutation, useQueryClient } from 'react-query';
import { deleteSocialPost } from '@/services/social/social-feed-service';
import { useToastStore } from '@/store/zustand/toast-store';
import { useTranslation } from 'react-i18next';
import { ProfileTabType } from './useUserPosts';

interface UseUserPostDeleteParams {
  tabType: ProfileTabType;
  targetUserId?: number;
}

export const useUserPostDelete = ({ tabType, targetUserId }: UseUserPostDeleteParams) => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const { t } = useTranslation();

  return useMutation(
    async (postCode: string) => {
      await deleteSocialPost(postCode);
      return postCode;
    },
    {
      onMutate: async (postCode) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries(['userPosts', tabType, targetUserId]);

        // Snapshot the previous value
        const previousData = queryClient.getQueryData(['userPosts', tabType, targetUserId]);

        // Optimistically remove the post from cache
        queryClient.setQueryData(['userPosts', tabType, targetUserId], (old: any) => {
          if (!old?.pages) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: {
                ...page.data,
                data: page.data?.data?.filter((post: any) => post.code !== postCode) || []
              }
            }))
          };
        });

        return { previousData };
      },
      onError: (err, postCode, context) => {
        // Rollback to previous data on error
        if (context?.previousData) {
          queryClient.setQueryData(['userPosts', tabType, targetUserId], context.previousData);
        }
        
        showToast(t('Failed to delete post. Please try again.'), 3000, 'error');
      },
      onSuccess: () => {
        // Invalidate all user posts caches to ensure consistency
        queryClient.invalidateQueries(['userPosts', ProfileTabType.Posts, targetUserId]);
        queryClient.invalidateQueries(['userPosts', ProfileTabType.Media, targetUserId]);
        queryClient.invalidateQueries(['userPosts', ProfileTabType.Likes, targetUserId]);
        queryClient.invalidateQueries(['userPosts', ProfileTabType.Reposts, targetUserId]);
        
        showToast(t('Post deleted successfully'), 3000, 'success');
      }
    }
  );
};
