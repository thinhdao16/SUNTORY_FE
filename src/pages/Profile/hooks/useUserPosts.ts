import { useInfiniteQuery, useQueryClient } from 'react-query';
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
  const { setActiveProfileKey, setPosts, appendPosts, setPaginationInfo } = useProfilePostsStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    setActiveProfileKey(profileKey);
  }, [profileKey]);

  return useInfiniteQuery(
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
          // totalPages is a count; with 0-based index, next exists if current + 1 < totalPages
          return current + 1 < pageData.totalPages ? current + 1 : undefined;
        }
        if (typeof pageData.lastPage === 'number') {
          // lastPage may be 1-based; allow next if current + 1 <= lastPage
          return current + 1 <= pageData.lastPage ? current + 1 : undefined;
        }
        return undefined;
      },
      keepPreviousData: true,
      staleTime: 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      enabled: options?.enabled ?? true,
      retry: false,
      onSuccess: (data) => {
        const pages = data?.pages || [];
        // Build a unique list by id or (code+type) with page 0 priority to avoid missing or collapsing repost/original
        const seen = new Set<string>();
        const combined: any[] = [];
        const takeList = (page: any) => {
          const d = (page as any)?.data;
          if (!d) return [] as any[];
          if (Array.isArray(d?.data)) return d.data as any[];
          if (Array.isArray(d?.items)) return d.items as any[];
          if (Array.isArray(d?.list)) return d.list as any[];
          if (Array.isArray(d)) return d as any[];
          if (Array.isArray((page as any)?.data?.result)) return (page as any).data.result as any[];
          return [] as any[];
        };
        for (let i = 0; i < pages.length; i++) {
          const list = takeList(pages[i]);
          for (let j = 0; j < list.length; j++) {
            const p = list[j];
            const key = (p?.code ? String(p.code) : (p?.id != null ? String(p.id) : undefined));
            if (!key || seen.has(key)) continue;
            seen.add(key);
            combined.push(p);
          }
        }
        setPosts(combined, profileKey);
        // pagination info from last page
        const last = pages[pages.length - 1];
        const pd: any = last?.data || {};
        const currentIndex = typeof pd.pageNumber === 'number' ? pd.pageNumber : Math.max(0, pages.length - 1);
        const totalPages = pd.totalPages ?? pd.lastPage ?? (currentIndex + 1);
        const hasNextPage = typeof pd.nextPage === 'boolean'
          ? Boolean(pd.nextPage)
          : (typeof pd.totalPages === 'number'
              ? currentIndex + 1 < pd.totalPages
              : (typeof pd.lastPage === 'number' ? currentIndex + 1 <= pd.lastPage : false));
        const totalRecords = pd.totalRecords ?? pd.totalCount ?? combined.length;
        setPaginationInfo({ currentPage: currentIndex, hasNextPage, totalPages, totalRecords }, profileKey);
      },
      onSettled: () => {
        // If any page failed, React Query may not call onSuccess. Rebuild from cached pages to ensure page 0 changes are applied.
        try {
          const cache = queryClient.getQueryData(['userPosts', tabType, targetUserId, pageSize]) as any;
          const pages = cache?.pages || [];
          if (!pages.length) return;
          const seen = new Set<string>();
          const combined: any[] = [];
          const takeList = (page: any) => {
            const d = (page as any)?.data;
            if (!d) return [] as any[];
            if (Array.isArray(d?.data)) return d.data as any[];
            if (Array.isArray(d?.items)) return d.items as any[];
            if (Array.isArray(d?.list)) return d.list as any[];
            if (Array.isArray(d)) return d as any[];
            if (Array.isArray((page as any)?.data?.result)) return (page as any).data.result as any[];
            return [] as any[];
          };
          for (let i = 0; i < pages.length; i++) {
            const list = takeList(pages[i]);
            for (let j = 0; j < list.length; j++) {
              const p = list[j];
              const key = (p?.code ? String(p.code) : (p?.id != null ? String(p.id) : undefined));
              if (!key || seen.has(key)) continue;
              seen.add(key);
              combined.push(p);
            }
          }
          if (combined.length) setPosts(combined, profileKey);
        } catch {}
      }
    }
  );
};
  
