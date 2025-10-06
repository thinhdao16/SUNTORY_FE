import { useMutation, useQueryClient } from 'react-query';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { useSocialFeedStore } from '@/store/zustand/social-feed-store';
import { useIonToast } from '@ionic/react';

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
        return { postCode };
      },
      onError: (err, variables, context) => {
        if (context?.postCode) {
          optimisticUpdatePostReaction(context.postCode);
        }
        
        present({
          message: 'Failed to update like. Please try again.',
          duration: 3000,
          position: 'bottom',
          color: 'danger'
        });
      },
      onSuccess: async (data) => {
        try {
          const fresh = await SocialFeedService.getPostByCode(data.postCode);
          updatePostReaction(fresh.code, fresh.isLike, fresh.reactionCount);
        } catch (error) {
        } finally {
          // queryClient.invalidateQueries('socialFeed');
          queryClient.invalidateQueries(['feedDetail', data.postCode]);
        }
      }
    }
  );
};
