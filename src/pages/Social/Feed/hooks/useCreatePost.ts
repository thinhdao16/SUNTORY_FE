import { useMutation, useQueryClient } from 'react-query';
import { createSocialPost, CreatePostRequest } from '@/services/social/social-feed-service';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';

export const useCreatePost = () => {
    const { t } = useTranslation();
    const history = useHistory();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createSocialPost,
        onSuccess: (data: any) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
                queryClient.invalidateQueries({ queryKey: ['userPosts'] });
                console.log('Post created successfully, feed will refresh');
            }
        },
        onError: (error: any) => {
            console.error('Failed to create post:', error);
        }
    });
};
