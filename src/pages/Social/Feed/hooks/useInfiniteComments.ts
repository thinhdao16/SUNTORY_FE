import { useInfiniteQuery } from 'react-query';
import { SocialCommentService } from '@/services/social/social-comment-service';

export const useInfiniteComments = (postCode: string | null | undefined, pageSize: number = 20) => {
  return useInfiniteQuery(
    ['comments', postCode],
    ({ pageParam = 0 }) => {
      if (!postCode) return null;
      return SocialCommentService.getCommentsByPostCode(postCode, pageParam, pageSize);
    },
    {
      enabled: !!postCode,
      getNextPageParam: (lastPage, allPages) => {
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
