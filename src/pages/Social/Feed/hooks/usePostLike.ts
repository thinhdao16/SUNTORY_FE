import { useMutation } from 'react-query';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { useSocialFeedStore } from '@/store/zustand/social-feed-store';
import { useIonToast } from '@ionic/react';

export const usePostLike = () => {
  const { optimisticUpdatePostReaction, updatePostReaction } = useSocialFeedStore();
  const [present] = useIonToast();

  return useMutation(
    async ({ postId, isLiked }: { postId: number; isLiked: boolean }) => {
      if (isLiked) {
        await SocialFeedService.unlikePost(postId);
      } else {
        await SocialFeedService.likePost(postId, false);
      }
      return { postId, isLiked };
    },
    {
      onMutate: async ({ postId }) => {
        // Optimistic update using store
        optimisticUpdatePostReaction(postId);
        return { postId };
      },
      onError: (err, variables, context) => {
        // Rollback optimistic update on error
        if (context?.postId) {
          optimisticUpdatePostReaction(context.postId);
        }
        
        // Show error toast
        present({
          message: 'Failed to update like. Please try again.',
          duration: 3000,
          position: 'bottom',
          color: 'danger'
        });
      },
      onSuccess: (data) => {
        // Server response successful, no need to update again since optimistic update was correct
        console.log('Like/unlike successful for post:', data.postId);
      }
    }
  );
};
