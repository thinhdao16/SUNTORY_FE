import { useMutation, useQueryClient } from 'react-query';
import { SocialCommentService } from '@/services/social/social-comment-service';
import { useToastStore } from '@/store/zustand/toast-store';
import { useTranslation } from 'react-i18next';

export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();
  const { t } = useTranslation();

  return useMutation(
    ({ commentCode, content, mediaFilenames }: { commentCode: string; content: string; mediaFilenames?: string[] }) => 
      SocialCommentService.updateComment(commentCode, content, mediaFilenames),
    {
      onSuccess: (updatedComment) => {
        queryClient.invalidateQueries(['comments']);
        
        showToast(t('Comment updated successfully'), 3000, 'success');
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || t('Failed to update comment');
        showToast(errorMessage, 4000, 'error');
      }
    }
  );
};
