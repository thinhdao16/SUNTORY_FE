import { useInfiniteQuery } from 'react-query';
import httpClient from '@/config/http-client';

export enum ProfileTabType {
    Posts = 10,
    Media = 20,
    Likes = 30,
    Reposts = 40,
}

interface UserPostsParams {
    tabType: ProfileTabType;
    targetUserId?: number;
    pageNumber: number;
    pageSize: number;
}

interface UserPostsResponse {
    data: any[];
    totalCount?: number;
    totalRecords?: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    lastPage: number;
    nextPage: boolean;
    previousPage: boolean;
}

const fetchUserPosts = async (params: UserPostsParams): Promise<UserPostsResponse> => {
    const response = await httpClient.get('/api/v1/social/post/user', {
        params: {
            TabType: params.tabType,
            TargetUserId: params.targetUserId,
            PageNumber: params.pageNumber,
            PageSize: params.pageSize,
        },
    });
    return response.data.data;
};

export const useUserPosts = (tabType: ProfileTabType, targetUserId?: number, pageSize = 10) => {
    return useInfiniteQuery(
      ['userPosts', tabType, targetUserId],
      ({ pageParam = 1 }) => fetchUserPosts({
        tabType,
        targetUserId,
        pageNumber: pageParam,
        pageSize,
      }),
      {
        getNextPageParam: (lastPage: UserPostsResponse) => {
          // an toàn: so sánh trang hiện tại với tổng trang
          if (!lastPage) return undefined;
          const current = lastPage.pageNumber ?? 1;
          const total = lastPage.totalPages ?? (lastPage.lastPage ?? current);
          return current < total ? current + 1 : undefined;
        },
        // keepPreviousData: true, // tùy chọn
      }
    );
  };
  
