import { SocialFeedService } from '@/services/social/social-feed-service';
import { useToastStore } from '@/store/zustand/toast-store';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from 'react-query';
import { SocialPost } from '@/types/social-feed';

export const usePinPost = () => {
    const queryClient = useQueryClient();
    const { showToast } = useToastStore();
    const { t } = useTranslation();

    return useMutation<SocialPost, any, string>(
        (postCode: string) => SocialFeedService.pinPost(postCode),
        {
            onSuccess: (updatedPost, postCode) => {
                // Invalidate and refetch userPosts queries to get new sorted order from BE
                queryClient.invalidateQueries(['userPosts']);

                // Invalidate feedDetail cache to refetch fresh data
                queryClient.invalidateQueries(['feedDetail', postCode]);

                showToast(
                    updatedPost.isPin ? t('Post pinned successfully') : t('Post unpinned successfully'),
                    1000,
                    'success'
                );
            },
            onError: (error) => {
                console.error('Pin/Unpin post error:', error);
                showToast(t('Failed to pin/unpin post'), 1000, 'error');
            },
        }
    );
};
