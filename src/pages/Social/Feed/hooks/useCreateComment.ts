import { useMutation, useQueryClient } from 'react-query';
import { SocialCommentService, CreateCommentRequest } from '@/services/social/social-comment-service';
import { useToastStore } from '@/store/zustand/toast-store';
import { useTranslation } from 'react-i18next';

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();
  const { t } = useTranslation();

  return useMutation(
    (data: CreateCommentRequest) => SocialCommentService.createComment(data),
    {
      onMutate: async (variables) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries(['comments', variables.postCode]);

        // Snapshot the previous value
        const previousComments = queryClient.getQueryData(['comments', variables.postCode]);

        // Optimistically update comments
        queryClient.setQueryData(['comments', variables.postCode], (old: any) => {
          if (!old?.pages) return old;

          const optimisticComment = {
            id: Date.now(), // Temporary ID
            content: variables.content,
            createdAt: new Date().toISOString(),
            user: queryClient.getQueryData(['auth', 'user']) || {},
            reactionCount: 0,
            isLike: false,
            replyCount: 0,
            replyCommentId: variables.replyCommentId || null,
            isOptimistic: true // Flag to identify optimistic updates
          };

          const pages = [...old.pages];
          if (pages[0]) {
            pages[0] = {
              ...pages[0],
              data: [optimisticComment, ...pages[0].data]
            };
          }

          return { ...old, pages };
        });

        // Update post comment count optimistically
        queryClient.setQueryData(['feedDetail', variables.postCode], (oldData: any) => {
          if (oldData) {
            return {
              ...oldData,
              commentCount: oldData.commentCount + 1
            };
          }
          return oldData;
        });

        return { previousComments };
      },
      onSuccess: (newComment, variables) => {
        // Replace optimistic comment with real data
        queryClient.setQueryData(['comments', variables.postCode], (old: any) => {
          if (!old?.pages) return old;

          const pages = old.pages.map((page: any) => {
            if (!page?.data) return page;
            
            const data = page.data.map((comment: any) => {
              if (comment.isOptimistic && comment.content === variables.content) {
                return { ...newComment, isOptimistic: false };
              }
              return comment;
            });

            return { ...page, data };
          });

          return { ...old, pages };
        });
        
        // Show success toast
        showToast(t('Comment posted successfully'), 3000, 'success');
      },
      onError: (error: any, variables, context) => {
        // Rollback optimistic update
        if (context?.previousComments) {
          queryClient.setQueryData(['comments', variables.postCode], context.previousComments);
        }

        // Rollback post comment count
        queryClient.setQueryData(['feedDetail', variables.postCode], (oldData: any) => {
          if (oldData) {
            return {
              ...oldData,
              commentCount: Math.max(0, oldData.commentCount - 1)
            };
          }
          return oldData;
        });

        const errorMessage = error?.response?.data?.message || t('Failed to post comment');
        showToast(errorMessage, 4000, 'error');
      }
    }
  );
};
