import { useQuery, useMutation, useQueryClient } from 'react-query';
import { SearchService, SearchUsersResponse, SearchPostsResponse, SearchHistoriesResponse } from '@/services/social/search-service';

export const searchQueryKeys = {
  users: (keyword: string, pageNumber: number = 1, pageSize: number = 10) => 
    ['searchUsers', keyword, pageNumber, pageSize],
  posts: (hashtag: string, pageNumber: number = 1, pageSize: number = 10) => 
    ['searchPosts', hashtag, pageNumber, pageSize],
  histories: (pageNumber: number = 1, pageSize: number = 10) => 
    ['searchHistories', pageNumber, pageSize],
};

export const useSearchUsers = (keyword: string, pageNumber: number = 1, pageSize: number = 10, enabled: boolean = true) => {
  return useQuery({
    queryKey: searchQueryKeys.users(keyword, pageNumber, pageSize),
    queryFn: () => SearchService.searchUsers(keyword, pageNumber, pageSize),
    enabled: enabled && keyword.length > 0,
    staleTime: 30000,
    select: (data: SearchUsersResponse) => data.data.data,
  });
};


export const useSearchHistories = (pageNumber: number = 0, pageSize: number = 20) => {
  return useQuery({
    queryKey: searchQueryKeys.histories(pageNumber, pageSize),
    queryFn: () => SearchService.getSearchHistories(pageNumber, pageSize),
    staleTime: 60000,
    select: (data: SearchHistoriesResponse) => data.data?.data || [],
  });
};

export const useSaveSearchHistory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ searchText, targetUserId, hashtagText }: { 
      searchText: string; 
      targetUserId?: number; 
      hashtagText?: string; 
    }) => SearchService.saveSearchHistory(searchText, targetUserId, hashtagText),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['searchHistories'] 
      });
    },
    onError: (error: any) => {
      console.warn('Failed to save search history:', error);
    },
  });
};

export const usePerformSearch = () => {
  const queryClient = useQueryClient();
  const saveHistoryMutation = useSaveSearchHistory();
  
  return useMutation({
    mutationFn: async ({ 
      searchQuery, 
      searchText, 
      hashtagText, 
      targetUserId,
      activeTab = 'all',
      shouldSaveHistory = false
    }: { 
      searchQuery: string;
      searchText?: string;
      hashtagText?: string;
      targetUserId?: number;
      activeTab?: string;
      shouldSaveHistory?: boolean;
    }) => {
      
      let usersResponse, postsResponse;
      
      switch (activeTab) {
        case 'people':
          usersResponse = await SearchService.searchUsers(searchQuery, 0, 20);
          postsResponse = { data: { data: [] } }; 
          break;
          
        case 'posts':
          usersResponse = { data: { data: [] } };
          postsResponse = await SearchService.searchPosts(searchQuery, 0, 20);
          break;
          
        case 'latest':
          usersResponse = { data: { data: [] } };
          postsResponse = await SearchService.searchFeed(searchQuery, 0, 20);
          break;
          
        case 'all':
        default:
          [usersResponse, postsResponse] = await Promise.all([
            SearchService.searchUsers(searchQuery, 0, 20),
            SearchService.searchPosts(searchQuery, 0, 20)
          ]);
          break;
      }
      
      if (shouldSaveHistory) {
        saveHistoryMutation.mutateAsync({ 
          searchText: searchText || '',
          hashtagText,
          targetUserId
        }).catch(() => {
        });
      }
      return {
        users: usersResponse.data.data,
        posts: postsResponse.data.data,
      };
    },
    onSuccess: (data: any, variables: any) => {
      queryClient.setQueryData(
        searchQueryKeys.users(variables.searchQuery, 1, 20),
        (oldData: any) => ({
          ...oldData,
          data: { ...oldData?.data, data: data.users }
        })
      );
      
      queryClient.setQueryData(
        searchQueryKeys.posts(variables.searchQuery, 1, 20),
        (oldData: any) => ({
          ...oldData,
          data: { ...oldData?.data, data: data.posts }
        })
      );
    },
  });
};
