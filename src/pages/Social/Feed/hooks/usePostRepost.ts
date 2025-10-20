import { useMutation } from 'react-query';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { useIonToast } from '@ionic/react';

export const usePostRepost = () => {
    const [present] = useIonToast();

    return useMutation(
        async ({ postCode, caption, privacy }: { postCode: string; caption: string; privacy: number }) => {
            await SocialFeedService.repostPost(postCode, caption, privacy);
            return { postCode, caption, privacy };
        },
        {
            onSuccess: (data) => {
                present({
                    message: 'Post reposted successfully!',
                    duration: 3000,
                    position: 'bottom',
                    color: 'success'
                });
                console.log('Repost successful for post:', data.postCode);
            },
            onError: (err: any) => {
                present({
                    message: t(err?.response?.data?.message, { ns: "api" }) || 'Failed to repost. Please try again.',
                    duration: 3000,
                    position: 'bottom',
                    color: 'danger'
                });
                console.error('Repost failed:', err);
            }
        }
    );
};
