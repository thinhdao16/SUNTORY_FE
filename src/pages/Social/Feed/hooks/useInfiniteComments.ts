import { useInfiniteQuery } from 'react-query';
import { SocialCommentService } from '@/services/social/social-comment-service';

export const useInfiniteComments = (postId: number | null, pageSize: number = 20) => {
  return useInfiniteQuery(
    ['comments', postId],
    ({ pageParam = 0 }) => {
      if (!postId) return null;
      return SocialCommentService.getCommentsByPostId(postId, pageParam, pageSize);
    },
    {
      enabled: !!postId,
      getNextPageParam: (lastPage, allPages) => {
        console.log(lastPage)
        if (!lastPage) {
          return undefined;
        }
        const totalLoadedComments = allPages.reduce((total, page) => total + (page?.data?.length || 0), 0);
        if (totalLoadedComments >= lastPage.totalRecords) {
          return undefined;
        }
        
        const nextPageNum = lastPage.pageNumber + 1;
        return nextPageNum;
      },
      staleTime: 0,
      refetchOnWindowFocus: false,
    }
  );
};
