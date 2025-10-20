import { useMutation, useQueryClient } from 'react-query';
import { useToastStore } from '@/store/zustand/toast-store';
import { useTranslation } from 'react-i18next';
import { ProfileTabType } from './useUserPosts';

interface UseUserPostUpdateParams {
  tabType: ProfileTabType;
  targetUserId?: number;
}

export const useUserPostUpdate = ({ tabType, targetUserId }: UseUserPostUpdateParams) => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const { t } = useTranslation();

  return useMutation(
    async (updatedPost: any) => {
      return updatedPost;
    },
    {
      onMutate: async (updatedPost) => {
        await queryClient.cancelQueries(['userPosts', tabType, targetUserId]);

        const previousData = queryClient.getQueryData(['userPosts', tabType, targetUserId]);
        queryClient.setQueryData(['userPosts', tabType, targetUserId], (old: any) => {
          if (!old?.pages) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: {
                ...page.data,
                data: page.data?.data?.map((post: any) => {
                  if (post.code === updatedPost.code || post.id === updatedPost.id) {
                    return {
                      ...post,
                      ...updatedPost,
                      code: post.code,
                      id: post.id,
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
        if (context?.previousData) {
          queryClient.setQueryData(['userPosts', tabType, targetUserId], context.previousData);
        }
        
        showToast(t('Failed to update post. Please try again.'), 3000, 'error');
      },
      onSuccess: (updatedPost) => {
        showToast(t('Post updated successfully'), 2000, 'success');
        queryClient.invalidateQueries(['userPosts']);
        queryClient.invalidateQueries(['socialFeed']);
        queryClient.invalidateQueries(['social-posts']);
        queryClient.invalidateQueries(['social-feed']);
      }
    }
  );
};
