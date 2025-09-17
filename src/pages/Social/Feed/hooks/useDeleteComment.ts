import { useMutation, useQueryClient } from 'react-query';
import { SocialCommentService } from '@/services/social/social-comment-service';
import { useToastStore } from '@/store/zustand/toast-store';
import { useTranslation } from 'react-i18next';

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();
  const { t } = useTranslation();

  return useMutation(
    (commentCode: string) => SocialCommentService.deleteComment(commentCode),
    {
      onSuccess: (_, commentCode) => {
        // Invalidate comments queries to refetch
        queryClient.invalidateQueries(['comments']);
        
        // Show success toast
        showToast(t('Comment deleted successfully'), 3000, 'success');
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || t('Failed to delete comment');
        showToast(errorMessage, 4000, 'error');
      }
    }
  );
};
