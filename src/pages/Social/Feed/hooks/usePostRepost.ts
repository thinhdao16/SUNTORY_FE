import { useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { useIonToast } from '@ionic/react';
import { useSocialFeedStore } from '@/store/zustand/social-feed-store';
import { SocialPost } from '@/types/social-feed';

export const usePostRepost = () => {
    const [present] = useIonToast();
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    return useMutation(
        async ({ postCode, caption, privacy }: { postCode: string; caption: string; privacy: number }) => {
            const created = await SocialFeedService.repostPost(postCode, caption, privacy);
            return created as SocialPost;
        },
        {
            onSuccess: async (_created, variables) => {
                try {
                    const originalCode = variables?.postCode;
                    if (!originalCode) return;
                    const fresh = await SocialFeedService.getPostByCode(originalCode);

                    const nowReposted = Boolean((fresh as any)?.isRepostedByCurrentUser);
                    present({
                        message: nowReposted
                            ? (t('Reposted successfully') || 'Post reposted successfully!')
                            : (t('Repost removed') || 'Repost removed'),
                        duration: 2000,
                        position: 'bottom',
                        color: nowReposted ? 'success' : 'medium'
                    });

                    const patch: Partial<SocialPost> = {
                        repostCount: fresh?.repostCount,
                        reactionCount: fresh?.reactionCount,
                        commentCount: fresh?.commentCount,
                        shareCount: fresh?.shareCount,
                        isRepostedByCurrentUser: (fresh as any)?.isRepostedByCurrentUser as any,
                    };

                    const store = useSocialFeedStore.getState();
                    store.applyRealtimePatch(originalCode, patch);
                    queryClient.setQueryData(['feedDetail', originalCode], fresh);
                    queryClient.invalidateQueries(['feedDetail', originalCode]);
                } catch (e) {
                }
            },
            onError: (err: any) => {
                present({
                    message: t(err?.response?.data?.message, { ns: 'api' }) || 'Failed to repost. Please try again.',
                    duration: 3000,
                    position: 'bottom',
                    color: 'danger'
                });
                console.error('Repost failed:', err);
            }
        }
    );
};
