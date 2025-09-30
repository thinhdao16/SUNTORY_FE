import { useMutation, useQueryClient } from 'react-query';
import { SocialCommentService } from '@/services/social/social-comment-service';
import { useToastStore } from '@/store/zustand/toast-store';
import { useTranslation } from 'react-i18next';

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();
  const { t } = useTranslation();

  return useMutation(
    ({ commentCode, postCode }: { commentCode: string; postCode: string }) => 
      SocialCommentService.deleteComment(commentCode),
    {
      onMutate: async ({ commentCode, postCode }) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries(['comments', postCode]);

        // Snapshot the previous value
        const previousComments = queryClient.getQueryData(['comments', postCode]);

        // Optimistically remove comment
        queryClient.setQueryData(['comments', postCode], (old: any) => {
          if (!old?.pages) return old;

          const pages = old.pages.map((page: any) => {
            if (!page?.data) return page;
            
            const data = page.data.filter((comment: any) => comment.code !== commentCode);
            return { ...page, data };
          });

          return { ...old, pages };
        });

        // Update post comment count optimistically
        queryClient.setQueryData(['feedDetail', postCode], (oldData: any) => {
          if (oldData) {
            return {
              ...oldData,
              commentCount: Math.max(0, oldData.commentCount - 1)
            };
          }
          return oldData;
        });

        return { previousComments, commentCode, postCode };
      },
      onSuccess: (_, { commentCode, postCode }) => {
        // Show success toast
        showToast(t('Comment deleted successfully'), 3000, 'success');
      },
      onError: (error: any, { commentCode, postCode }, context) => {
        // Rollback optimistic update
        if (context?.previousComments) {
          queryClient.setQueryData(['comments', postCode], context.previousComments);
        }

        // Rollback post comment count
        queryClient.setQueryData(['feedDetail', postCode], (oldData: any) => {
          if (oldData) {
            return {
              ...oldData,
              commentCount: oldData.commentCount + 1
            };
          }
          return oldData;
        });

        const errorMessage = error?.response?.data?.message || t('Failed to delete comment');
        showToast(errorMessage, 4000, 'error');
      }
    }
  );
};
