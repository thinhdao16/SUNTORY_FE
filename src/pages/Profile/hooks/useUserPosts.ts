import { useInfiniteQuery } from 'react-query';
import httpClient from '@/config/http-client';
import { useEffect } from 'react';
import { useProfilePostsStore, generateProfileKey } from '@/store/zustand/profile-posts-store';

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
  const profileKey = generateProfileKey(tabType, targetUserId);
  const { setActiveProfileKey, setPosts, setPaginationInfo } = useProfilePostsStore();

  useEffect(() => {
    setActiveProfileKey(profileKey);
  }, [profileKey]);

  // Helper to extract posts from a page payload with flexible shapes
  const takeList = (page: any): any[] => {
    const d = page?.data;
    if (!d) return [] as any[];
    if (Array.isArray(d?.data)) return d.data as any[];
    if (Array.isArray(d?.items)) return d.items as any[];
    if (Array.isArray(d?.list)) return d.list as any[];
    if (Array.isArray(d)) return d as any[];
    if (Array.isArray(page?.data?.result)) return page.data.result as any[];
    return [] as any[];
  };

  // (Removed redundant sync effect that didn't track query changes)

  const query = useInfiniteQuery(
    ['userPosts', tabType, targetUserId, pageSize],
    ({ pageParam = 0 }) => fetchUserPosts({
      tabType,
      targetUserId,
      pageNumber: pageParam,
      pageSize,
    }),
    {
      getNextPageParam: (lastPage: UserPostsResponse) => {
        if (!lastPage || !lastPage.data) return undefined;
        const pageData: any = lastPage.data as any;
        const current: number = typeof pageData.pageNumber === 'number' ? pageData.pageNumber : 0;
        if (typeof pageData.nextPage === 'boolean') {
          return pageData.nextPage ? current + 1 : undefined;
        }
        if (typeof pageData.totalPages === 'number') {
          return current + 1 < pageData.totalPages ? current + 1 : undefined;
        }
        if (typeof pageData.lastPage === 'number') {
          return current + 1 <= pageData.lastPage ? current + 1 : undefined;
        }
        return undefined;
      },
      keepPreviousData: true,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      enabled: options?.enabled ?? true,
      retry: false,
    }
  );

  // Sync store whenever query data changes
  useEffect(() => {
    const pages = (query as any)?.data?.pages || [];
    if (!pages.length) return;
    const seen = new Set<string>();
    const combined: any[] = [];
    for (let i = 0; i < pages.length; i++) {
      const list = takeList(pages[i]);
      for (let j = 0; j < list.length; j++) {
        const p = list[j];
        const key = p?.code || p?.id;
        if (!key) continue;
        const sk = String(key);
        if (seen.has(sk)) continue;
        seen.add(sk);
        combined.push(p);
      }
    }
    setPosts(combined, profileKey);
    const last = pages[pages.length - 1];
    const pd: any = last?.data || {};
    const currentIndex = typeof pd.pageNumber === 'number' ? pd.pageNumber : Math.max(0, pages.length - 1);
    const totalPages = pd.totalPages ?? pd.lastPage ?? pages.length;
    const hasNext = (typeof pd.nextPage === 'boolean'
      ? !!pd.nextPage
      : (typeof pd.totalPages === 'number' ? currentIndex + 1 < pd.totalPages : (typeof pd.lastPage === 'number' ? currentIndex + 1 <= pd.lastPage : false)));
    const totalRecords = pd.totalRecords || pd.totalCount || combined.length;
    setPaginationInfo({ currentPage: currentIndex, hasNextPage: !!hasNext, totalPages, totalRecords }, profileKey);
  }, [query.data, profileKey, setPosts, setPaginationInfo]);

  return query;
};
