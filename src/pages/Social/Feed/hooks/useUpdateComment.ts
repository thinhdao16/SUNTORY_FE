import { useMutation, useQueryClient } from 'react-query';
import { SocialCommentService } from '@/services/social/social-comment-service';
import { useToastStore } from '@/store/zustand/toast-store';
import { useTranslation } from 'react-i18next';

export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();
  const { t } = useTranslation();

  return useMutation(
    ({ commentCode, content, mediaFilenames, postCode }: { 
      commentCode: string; 
      content: string; 
      mediaFilenames?: string[];
      postCode: string;
    }) => 
      SocialCommentService.updateComment(commentCode, content, mediaFilenames),
    {
      onMutate: async ({ commentCode, content, postCode }) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries(['comments', postCode]);

        // Snapshot the previous value
        const previousComments = queryClient.getQueryData(['comments', postCode]);

        // Optimistically update comment
        queryClient.setQueryData(['comments', postCode], (old: any) => {
          if (!old?.pages) return old;

          const pages = old.pages.map((page: any) => {
            if (!page?.data) return page;
            
            const data = page.data.map((comment: any) => {
              if (comment.code === commentCode) {
                return {
                  ...comment,
                  content,
                  isEdited: true,
                  editedAt: new Date().toISOString()
                };
              }
              return comment;
            });

            return { ...page, data };
          });

          return { ...old, pages };
        });

        return { previousComments, commentCode, postCode };
      },
      onSuccess: (updatedComment, { postCode }) => {
        // Replace optimistic update with real data
        queryClient.setQueryData(['comments', postCode], (old: any) => {
          if (!old?.pages) return old;

          const pages = old.pages.map((page: any) => {
            if (!page?.data) return page;
            
            const data = page.data.map((comment: any) => {
              if (comment.code === updatedComment.code) {
                return updatedComment;
              }
              return comment;
            });

            return { ...page, data };
          });

          return { ...old, pages };
        });
        
        showToast(t('Comment updated successfully'), 3000, 'success');
      },
      onError: (error: any, { postCode }, context) => {
        // Rollback optimistic update
        if (context?.previousComments) {
          queryClient.setQueryData(['comments', postCode], context.previousComments);
        }

        const errorMessage = error?.response?.data?.message || t('Failed to update comment');
        showToast(errorMessage, 4000, 'error');
      }
    }
  );
};
