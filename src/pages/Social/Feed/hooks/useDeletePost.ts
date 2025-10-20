import { deleteSocialPost } from '../../../../services/social/social-feed-service';
import { useToastStore } from '../../../../store/zustand/toast-store';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from 'react-query';
import { useSocialFeedStore } from '../../../../store/zustand/social-feed-store';
import { useSearchResultsStore } from '@/store/zustand/search-results-store';

export const useDeletePost = () => {
    const queryClient = useQueryClient();
    const { showToast } = useToastStore();
    const { t } = useTranslation();
    const { removePostFromFeeds } = useSocialFeedStore();

    return useMutation<{ success: boolean; message?: string }, any, string, { previousUserPosts: Array<[any, any]> }>(
        (postCode: string) => deleteSocialPost(postCode),
        {
        onMutate: async (postCode: string) => {
            // Cancel outgoing fetches for all userPosts queries
            await queryClient.cancelQueries(['userPosts']);

            // Snapshot previous data for rollback
            const previousUserPosts = queryClient.getQueriesData(['userPosts']) as Array<[any, any]>;

            // Try to find the deleted post entity BEFORE we remove it from caches
            let toDeleteEntity: any = queryClient.getQueryData(['feedDetail', postCode]);
            if (!toDeleteEntity) {
                const matching = queryClient.getQueriesData(['userPosts']) as Array<[any, any]>;
                for (const [_, old] of matching) {
                    if (!old?.pages) continue;
                    for (const page of old.pages) {
                        const list = Array.isArray(page?.data?.data) ? page.data.data : [];
                        const hit = list.find((p: any) => p?.code === postCode);
                        if (hit) { toDeleteEntity = hit; break; }
                    }
                    if (toDeleteEntity) break;
                }
            }

            // Optimistically remove from all userPosts paginated caches
            const matchingQueries = queryClient.getQueriesData(['userPosts']) as Array<[any, any]>;
            matchingQueries.forEach(([qk, old]) => {
                if (!old?.pages) return;
                try {
                    const newData = {
                        ...old,
                        pages: old.pages.map((page: any) => {
                            if (!page?.data) return page;
                            const prevList = Array.isArray(page.data?.data) ? page.data.data : [];
                            const filtered = prevList.filter((p: any) => p?.code !== postCode);
                            if (filtered === prevList) return page;
                            return {
                                ...page,
                                data: { ...page.data, data: filtered },
                            };
                        }),
                    };
                    queryClient.setQueryData(qk as any, newData);
                } catch {
                    // ignore
                }
            });

            // Also remove from feeds immediately (other screens)
            requestAnimationFrame(() => removePostFromFeeds(postCode));
            // And remove from search results store immediately
            try { useSearchResultsStore.getState().removePost(postCode); } catch {}

            // If this was a repost card, decrement original's repostCount and mark unreposted by me
            try {
                const originalCode: string | undefined = toDeleteEntity?.originalPost?.code;
                if (originalCode) {
                    // Read prev from feed store caches
                    const state = useSocialFeedStore.getState();
                    let prev: number | undefined;
                    Object.keys(state.cachedFeeds || {}).forEach((key) => {
                        (state.cachedFeeds[key]?.posts || []).forEach((p: any) => {
                            if (p?.code === originalCode || p?.originalPost?.code === originalCode) {
                                if (prev === undefined) prev = p?.repostCount;
                            }
                        });
                    });
                    const next = Math.max(0, (prev ?? 1) - 1);
                    state.applyRealtimePatch(originalCode, { repostCount: next, isRepostedByCurrentUser: false } as any);
                    queryClient.invalidateQueries(['feedDetail', originalCode]);
                }
            } catch {}

            return { previousUserPosts };
        },
        onSuccess: (result, postCode) => {
            if (result.success) {
                // Use requestAnimationFrame to avoid blocking UI and the new efficient method
                requestAnimationFrame(() => {
                    removePostFromFeeds(postCode);
                    try { useSearchResultsStore.getState().removePost(postCode); } catch {}
                    // Also ensure all userPosts caches no longer contain the post
                    const matchingQueries = queryClient.getQueriesData(['userPosts']) as Array<[any, any]>;
                    matchingQueries.forEach(([qk, old]) => {
                        if (!old?.pages) return;
                        try {
                            const newData = {
                                ...old,
                                pages: old.pages.map((page: any) => {
                                    if (!page?.data) return page;
                                    const prevList = Array.isArray(page.data?.data) ? page.data.data : [];
                                    const filtered = prevList.filter((p: any) => p?.code !== postCode);
                                    if (filtered === prevList) return page;
                                    return { ...page, data: { ...page.data, data: filtered } };
                                }),
                            };
                            queryClient.setQueryData(qk as any, newData);
                        } catch {
                            // ignore
                        }
                    });
                });
                
                showToast(t('Post deleted successfully'), 1000, 'success');
            } else {
                showToast(result.message || t('Failed to delete post'), 1000, 'error');
            }
        },
        onError: (error, postCode, context) => {
            console.error('Delete post error:', error);
            showToast(t('Failed to delete post'), 1000, 'error');
            // Rollback userPosts caches
            if (context?.previousUserPosts) {
                context.previousUserPosts.forEach(([qk, data]) => {
                    queryClient.setQueryData(qk as any, data);
                });
            }
        },
     }
    );
};
