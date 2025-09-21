import { deleteSocialPost } from '../../../../services/social/social-feed-service';
import { useToastStore } from '../../../../store/zustand/toast-store';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from 'react-query';
import { useSocialFeedStore } from '../../../../store/zustand/social-feed-store';

export const useDeletePost = () => {
    const queryClient = useQueryClient();
    const { showToast } = useToastStore();
    const { t } = useTranslation();
    const { removePostFromFeeds } = useSocialFeedStore();

    return useMutation({
        mutationFn: (postCode: string) => deleteSocialPost(postCode),
        onSuccess: (result, postCode) => {
            if (result.success) {
                // Use requestAnimationFrame to avoid blocking UI and the new efficient method
                requestAnimationFrame(() => {
                    removePostFromFeeds(postCode);
                });
                
                showToast(t('Post deleted successfully'), 1000, 'success');
            } else {
                showToast(result.message || t('Failed to delete post'), 1000, 'error');
            }
        },
        onError: (error: any, postCode, context) => {
            console.error('Delete post error:', error);
            showToast(t('Failed to delete post'), 1000, 'error');
        },
     
    });
};
