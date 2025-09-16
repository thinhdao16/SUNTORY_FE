import { useQuery } from 'react-query';
import { SocialCommentService } from '@/services/social/social-comment-service';

export const useComments = (postId: number | null, pageNumber: number = 0, pageSize: number = 20) => {
  return useQuery(
    ['comments', postId, pageNumber, pageSize],
    () => {
      if (!postId) return null;
      return SocialCommentService.getCommentsByPostId(postId, pageNumber, pageSize);
    },
    {
      enabled: !!postId,
      staleTime: 1000 * 60 * 2, 
      refetchOnWindowFocus: false,
    }
  );
};
