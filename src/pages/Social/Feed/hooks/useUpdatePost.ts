import { useMutation, useQueryClient } from 'react-query';
import { updateSocialPost, UpdatePostRequest } from '@/services/social/social-feed-service';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';

export const useUpdatePost = () => {
    const { t } = useTranslation();
    const history = useHistory();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateSocialPost,
        onSuccess: (data: any) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['social-posts'] });
                queryClient.invalidateQueries({ queryKey: ['social-feed'] });
                queryClient.invalidateQueries({ queryKey: ['post-detail'] });
                queryClient.invalidateQueries(['userPosts']);
                queryClient.invalidateQueries(['socialFeed']);
                queryClient.invalidateQueries(['social-posts']);
                queryClient.invalidateQueries(['social-feed']);
            }
        },
        onError: (error: any) => {
            console.error('Failed to update post:', error);
        }
    });
};
