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
      onSuccess: (newComment, variables) => {
        // Update the post's comment count in cache
        queryClient.setQueryData(['feedDetail', variables.postId], (oldData: any) => {
          if (oldData) {
            return {
              ...oldData,
              commentCount: oldData.commentCount + 1
            };
          }
          return oldData;
        });

        // Invalidate comments query to refetch
        queryClient.invalidateQueries(['comments', variables.postId]);
        
        // Show success toast
        showToast(t('Comment posted successfully'), 3000, 'success');
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || t('Failed to post comment');
        showToast(errorMessage, 4000, 'error');
      }
    }
  );
};
