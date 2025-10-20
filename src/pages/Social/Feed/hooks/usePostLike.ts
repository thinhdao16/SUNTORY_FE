import { useMutation, useQueryClient } from 'react-query';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { useSocialFeedStore } from '@/store/zustand/social-feed-store';
import { useIonToast } from '@ionic/react';
import { useSearchResultsStore } from '@/store/zustand/search-results-store';

export const usePostLike = () => {
  const { optimisticUpdatePostReaction, updatePostReaction } = useSocialFeedStore();
  const [present] = useIonToast();
  const queryClient = useQueryClient();

  return useMutation(
    async ({ postCode, isLiked }: { postCode: string; isLiked: boolean }) => {
      if (isLiked) {
        await SocialFeedService.unlikePost(postCode);
      } else {
        await SocialFeedService.likePost(postCode, false);
      }
      return { postCode, isLiked };
    },
    {
      onMutate: async ({ postCode }) => {
        optimisticUpdatePostReaction(postCode);
        try { useSearchResultsStore.getState().optimisticUpdatePostReaction(postCode); } catch {}
        return { postCode };
      },
      onError: (err, variables, context) => {
        if (context?.postCode) {
          optimisticUpdatePostReaction(context.postCode);
          try { useSearchResultsStore.getState().optimisticUpdatePostReaction(context.postCode); } catch {}
        }
        
        present({
          message: 'Failed to update like. Please try again.',
          duration: 3000,
          position: 'bottom',
          color: 'danger'
        });
      },
      onSuccess: async (data) => {
        // Do not fetch detail or invalidate; avoid duplicate calls.
        // Optimistic UI is already applied. SignalR will deliver exact values.
      }
    }
  );
};
