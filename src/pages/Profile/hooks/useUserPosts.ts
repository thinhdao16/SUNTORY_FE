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
    data: any;
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
    return response.data;
};

export const useUserPosts = (
  tabType: ProfileTabType,
  targetUserId?: number,
  pageSize = 10,
  options?: { enabled?: boolean }
) => {
  return useInfiniteQuery(
    ['userPosts', tabType, targetUserId, pageSize],
    ({ pageParam = 1 }) => fetchUserPosts({
      tabType,
      targetUserId,
      pageNumber: pageParam,
      pageSize,
    }),
    {
      getNextPageParam: (lastPage: UserPostsResponse) => {
        if (!lastPage) return undefined;
        const current = lastPage?.data?.pageNumber ?? 1;
        const total = lastPage?.data?.totalPages ?? (lastPage?.data?.lastPage ?? current);
        return current < total ? current + 1 : undefined;
      },
      keepPreviousData: true,
      staleTime: 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      enabled: options?.enabled ?? true,
      retry: false,
    }
  );
};
  
