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
          }
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
