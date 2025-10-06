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

    return useMutation<{ success: boolean; message?: string }, any, string, { previousUserPosts: Array<[any, any]> }>(
        (postCode: string) => deleteSocialPost(postCode),
        {
        onMutate: async (postCode: string) => {
            // Cancel outgoing fetches for all userPosts queries
            await queryClient.cancelQueries(['userPosts']);

            // Snapshot previous data for rollback
            const previousUserPosts = queryClient.getQueriesData(['userPosts']) as Array<[any, any]>;

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

            return { previousUserPosts };
        },
        onSuccess: (result, postCode) => {
            if (result.success) {
                // Use requestAnimationFrame to avoid blocking UI and the new efficient method
                requestAnimationFrame(() => {
                    removePostFromFeeds(postCode);
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
