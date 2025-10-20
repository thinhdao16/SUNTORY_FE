import { useMutation, useQueryClient } from 'react-query';
import { useToastStore } from '@/store/zustand/toast-store';
import { useTranslation } from 'react-i18next';
import { ProfileTabType } from './useUserPosts';
import { useProfilePostsStore } from '@/store/zustand/profile-posts-store';

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
        // Apply patch immediately to profile posts store (optimistic UI)
        try { if (updatedPost?.code) useProfilePostsStore.getState().applyPatch(updatedPost.code, updatedPost as any); } catch {}
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
        try { if ((updatedPost as any)?.code) useProfilePostsStore.getState().applyPatch((updatedPost as any).code, updatedPost as any); } catch {}
        queryClient.invalidateQueries(['userPosts']);
        queryClient.invalidateQueries(['socialFeed']);
        queryClient.invalidateQueries(['social-posts']);
        queryClient.invalidateQueries(['social-feed']);
      }
    }
  );
};
