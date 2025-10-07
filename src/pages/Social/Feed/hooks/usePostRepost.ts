import { useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { useIonToast } from '@ionic/react';
import { useSocialFeedStore } from '@/store/zustand/social-feed-store';
import { SocialPost } from '@/types/social-feed';
import { ProfileTabType } from '@/pages/Profile/hooks/useUserPosts';

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
            onSuccess: async (created, variables) => {
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
                    // Prepend created repost to Profile Reposts caches (owner)
                    try {
                        const ownerId = (created as any)?.userId;
                        const matching = queryClient.getQueriesData(['userPosts']) as Array<[any, any]>;
                        matching.forEach(([qk, old]) => {
                            if (!old?.pages?.length || !Array.isArray(qk)) return;
                            const tabTypeQ = qk[1];
                            const targetUserIdQ = qk[2];
                            const isRepostsTab = tabTypeQ === ProfileTabType.Reposts;
                            const isOwnerProfile = !targetUserIdQ || Number(targetUserIdQ) === Number(ownerId);
                            if (!isRepostsTab || !isOwnerProfile) return;
                            try {
                                const firstPage = old.pages[0];
                                const list = Array.isArray(firstPage?.data?.data) ? firstPage.data.data : [];
                                const deduped = list.filter((p: any) => p?.code !== (created as any)?.code);
                                const updatedFirst = { ...firstPage, data: { ...firstPage?.data, data: [created, ...deduped] } };
                                const newData = { ...old, pages: [updatedFirst, ...old.pages.slice(1)] };
                                queryClient.setQueryData(qk as any, newData);
                            } catch {}
                        });
                        if ((created as any)?.code) queryClient.setQueryData(['feedDetail', (created as any).code], created);
                    } catch {}
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
