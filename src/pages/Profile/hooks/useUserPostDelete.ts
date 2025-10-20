import { useMutation, useQueryClient } from 'react-query';
import { deleteSocialPost } from '@/services/social/social-feed-service';
import { useToastStore } from '@/store/zustand/toast-store';
import { useTranslation } from 'react-i18next';
import { ProfileTabType } from './useUserPosts';
import { useSearchResultsStore } from '@/store/zustand/search-results-store';
import { useSocialFeedStore } from '@/store/zustand/social-feed-store';

interface UseUserPostDeleteParams {
  tabType: ProfileTabType;
  targetUserId?: number;
}
export const useUserPostDelete = ({ tabType, targetUserId }: UseUserPostDeleteParams) => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const { t } = useTranslation();
  const socialFeedStore = useSocialFeedStore();
  const searchResultsStore = useSearchResultsStore();

    return useMutation(
      async (postCode: string) => {
        await deleteSocialPost(postCode);
        return postCode;
      },
      {
      onMutate: async (postCode) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries(['userPosts', tabType, targetUserId]);

        // Snapshot the previous value
        const previousData = queryClient.getQueryData(['userPosts', tabType, targetUserId]);

        // Optimistically remove the post from ALL userPosts caches (all tabs/users)
        const allUserPosts = queryClient.getQueriesData(['userPosts']) as Array<[any, any]> ;
        allUserPosts.forEach(([qk, old]) => {
          if (!old?.pages) return;
          const newData = {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: {
                ...page.data,
                data: (Array.isArray(page.data?.data) ? page.data.data : []).filter((p: any) => p?.code !== postCode)
              }
            }))
          };
          queryClient.setQueryData(qk as any, newData);
        });

        // Also remove from feeds and search stores immediately
        try { useSocialFeedStore.getState().removePostFromFeeds(postCode); } catch {}
        try { useSearchResultsStore.getState().removePost(postCode); } catch {}

        // Try to decrement original post's repostCount in stores if this was a repost card
        try {
          const detail = queryClient.getQueryData(['feedDetail', postCode]) as any;
          const originalCode = detail?.originalPost?.code;
          if (originalCode) {
            // Compute prev from any known cache
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

        return { previousData };
      },
      onError: (err, postCode, context) => {
        // Rollback to previous data on error
        if (context?.previousData) {
          queryClient.setQueryData(['userPosts', tabType, targetUserId], context.previousData);
        }
        
        showToast(t('Failed to delete post. Please try again.'), 3000, 'error');
      },
      onSuccess: () => {
        // Invalidate all user posts caches to ensure consistency
        queryClient.invalidateQueries(['userPosts', ProfileTabType.Posts, targetUserId]);
        queryClient.invalidateQueries(['userPosts', ProfileTabType.Media, targetUserId]);
        queryClient.invalidateQueries(['userPosts', ProfileTabType.Likes, targetUserId]);
        queryClient.invalidateQueries(['userPosts', ProfileTabType.Reposts, targetUserId]);
        // Also sync feedDetail for the deleted repost itself
        // It was removed; ensure any detail view is cleared
        // Leave as optional no-op
        // Ensure removed from search/feed stores as well
        // (in case SignalR message delays)
        // Note: ignore errors if stores unavailable in this context
        try { /* no-op; handled in onMutate and SignalR */ } catch {}
        
        showToast(t('Post deleted successfully'), 3000, 'success');
      }
    }
  );
};
