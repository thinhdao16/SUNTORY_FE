import { useMutation, useQueryClient } from 'react-query';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { useIonToast } from '@ionic/react';

export const useCommentLike = () => {
  const [present] = useIonToast();
  const queryClient = useQueryClient();

  return useMutation(
    async ({ commentCode, isLiked, postCode }: { commentCode: string; isLiked: boolean; postCode: string }) => {
      if (isLiked) {
        await SocialFeedService.unlikeComment(commentCode);
      } else {
        await SocialFeedService.likeComment(commentCode, false);
      }
      return { commentCode, isLiked, postCode };
    },
    {
      onMutate: async ({ commentCode, isLiked, postCode }) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries(['comments', postCode]);

        // Snapshot the previous value
        const previousComments = queryClient.getQueryData(['comments', postCode]);

        // Optimistically update the comment in the cache
        queryClient.setQueryData(['comments', postCode], (old: any) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data?.map((comment: any) => {
                if (comment.code === commentCode) {
                  return {
                    ...comment,
                    isLike: !isLiked,
                    reactionCount: isLiked ? comment.reactionCount - 1 : comment.reactionCount + 1
                  };
                }
                return comment;
              }) || []
            }))
          };
        });

        // Return a context object with the snapshotted value
        return { previousComments, commentCode, postCode };
      },
      onError: (err, variables, context) => {
        // Rollback optimistic update on error
        if (context?.previousComments) {
          queryClient.setQueryData(['comments', context.postCode], context.previousComments);
        }
        
        // Show error toast
        present({
          message: 'Failed to update comment like. Please try again.',
          duration: 3000,
          position: 'bottom',
          color: 'danger'
        });
      },
      onSuccess: (data) => {
        console.log('Comment like/unlike successful for comment:', data.commentCode);
      },
      onSettled: (data, error, variables) => {
        // Always refetch after error or success to ensure consistency
        queryClient.invalidateQueries(['comments', variables.postCode]);
      }
    }
  );
};
