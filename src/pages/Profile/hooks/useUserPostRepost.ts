import { useMutation, useQueryClient } from 'react-query';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { useToastStore } from '@/store/zustand/toast-store';
import { useTranslation } from 'react-i18next';
import { ProfileTabType } from './useUserPosts';

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
      await SocialFeedService.repostPost(postCode, caption, privacy);
      return { postCode, caption, privacy };
    },
    {
      onSuccess: (data) => {
        // Invalidate ALL userPosts queries to ensure consistency across all tabs
        queryClient.invalidateQueries(['userPosts']);
        
        // Also invalidate social feed queries
        queryClient.invalidateQueries(['socialFeed']);
        queryClient.invalidateQueries(['social-posts']);
        queryClient.invalidateQueries(['social-feed']);
        
        showToast(t('Post reposted successfully!'), 3000, 'success');
      },
      onError: (err) => {
        showToast(t('Failed to repost. Please try again.'), 3000, 'error');
        console.error('Repost failed:', err);
      }
    }
  );
};
