import { useMutation, useQueryClient } from 'react-query';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { useToastStore } from '@/store/zustand/toast-store';
import { useTranslation } from 'react-i18next';
import { ProfileTabType } from './useUserPosts';
import { useSocialFeedStore } from '@/store/zustand/social-feed-store';
import { SocialPost } from '@/types/social-feed';

interface UseUserPostRepostParams {
  tabType: ProfileTabType;
  targetUserId?: number;
}

export const useUserPostRepost = ({ tabType, targetUserId }: UseUserPostRepostParams) => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const { t } = useTranslation();

  return useMutation(
    async ({ postCode, caption, privacy }: { postCode: string; caption: string; privacy: number }) => {
      const created = await SocialFeedService.repostPost(postCode, caption, privacy);
      return created as SocialPost;
    },
    {
      onMutate: async ({ postCode }) => {
        try {
          const originalCode = postCode;
          // Find previous repostCount from any userPosts cache
          let prevCount: number | undefined;
          const matching = queryClient.getQueriesData(['userPosts']) as Array<[any, any]>;
          matching.forEach(([qk, old]) => {
            if (!old?.pages) return;
            old.pages.forEach((page: any) => {
              const list = Array.isArray(page?.data?.data) ? page.data.data : [];
              list.forEach((p: any) => {
                if (p?.code === originalCode && prevCount === undefined) prevCount = p?.repostCount;
              });
            });
          });

          const optimistic = Math.max(0, (prevCount ?? 0) + 1);
          // Patch userPosts caches optimistically
          matching.forEach(([qk, old]) => {
            if (!old?.pages) return;
            try {
              const newData = {
                ...old,
                pages: old.pages.map((page: any) => {
                  if (!page?.data) return page;
                  const list = Array.isArray(page.data?.data) ? page.data.data : [];
                  if (!list.length) return page;
                  const updated = list.map((p: any) => p?.code === originalCode ? { ...p, repostCount: optimistic, isRepostedByCurrentUser: true } : p);
                  return { ...page, data: { ...page.data, data: updated } };
                }),
              };
              queryClient.setQueryData(qk as any, newData);
            } catch {}
          });

          // Patch feed store + detail cache optimistically
          const store = useSocialFeedStore.getState();
          store.applyRealtimePatch(originalCode, { repostCount: optimistic, isRepostedByCurrentUser: true } as any);
          queryClient.setQueryData(['feedDetail', originalCode], (old: any) => ({ ...(old || {}), repostCount: optimistic, isRepostedByCurrentUser: true }));
        } catch {}
      },
      onSuccess: async (created, variables) => {
        try {
          const store = useSocialFeedStore.getState();
          const originalCode: string | undefined = variables?.postCode;
          if (originalCode) {
            const fresh = await SocialFeedService.getPostByCode(originalCode);
            const patch: Partial<SocialPost> = {
              isRepostedByCurrentUser: (fresh as any)?.isRepostedByCurrentUser as any,
              repostCount: fresh?.repostCount,
              reactionCount: fresh?.reactionCount,
              commentCount: fresh?.commentCount,
              shareCount: fresh?.shareCount,
            };
            store.applyRealtimePatch(originalCode, patch);
            queryClient.setQueryData(['feedDetail', originalCode], fresh);
            queryClient.invalidateQueries(['feedDetail', originalCode]);

            // Also patch all profile userPosts caches so counts reflect immediately (Posts/Media/Likes/Reposts lists)
            try {
              const matching = queryClient.getQueriesData(['userPosts']) as Array<[any, any]>;
              matching.forEach(([qk, old]) => {
                if (!old?.pages) return;
                try {
                  const newData = {
                    ...old,
                    pages: old.pages.map((page: any) => {
                      if (!page?.data) return page;
                      const list = Array.isArray(page.data?.data) ? page.data.data : [];
                      if (!list.length) return page;
                      const updated = list.map((p: any) => p?.code === originalCode ? { ...p, ...patch } : p);
                      return { ...page, data: { ...page.data, data: updated } };
                    }),
                  };
                  queryClient.setQueryData(qk as any, newData);
                } catch {}
              });
            } catch {}
          }
          // Optimistically add created repost to Profile Reposts tab cache(s)
          try {
            const ownerId = created?.userId;
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
                const deduped = list.filter((p: any) => p?.code !== created?.code);
                const updatedFirst = { ...firstPage, data: { ...firstPage?.data, data: [created, ...deduped] } };
                const newData = { ...old, pages: [updatedFirst, ...old.pages.slice(1)] };
                queryClient.setQueryData(qk as any, newData);
              } catch {}
            });
          } catch {}
          // Optionally append created repost to feeds for visibility (dedupe handled in store)
          Object.keys(store.cachedFeeds || {}).forEach((fk) => { const f = store.cachedFeeds[fk as any]; if (f) store.appendFeedPosts([created], fk); });
          if (created?.code) queryClient.setQueryData(['feedDetail', created.code], created);
        } catch {}
        showToast(t('Post reposted successfully!'), 3000, 'success');
      },
      onError: (err) => {
        showToast(t('Failed to repost. Please try again.'), 3000, 'error');
        console.error('Repost failed:', err);
      }
    }
  );
};
