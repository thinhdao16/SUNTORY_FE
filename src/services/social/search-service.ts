import httpClient from '@/config/http-client';

export interface SearchUser {
    id: number;
    code: string;
    firstname: string;
    lastname: string;
    fullName: string;
    email: string;
    avatar: string | null;
    username?: string;
    isVerified?: boolean;
    postCount?: number;
    unseenPostCount?: number;
}

export interface SearchUsersResponse {
    result: number;
    errors: null;
    message: string;
    data: {
        pageNumber: number;
        pageSize: number;
        firstPage: number;
        lastPage: number;
        totalPages: number;
        totalRecords: number;
        nextPage: number | null;
        previousPage: number | null;
        data: SearchUser[];
    };
}

export interface SearchPost {
    code: string;
    content: string;
    user: SearchUser;
    media: any[];
    reactionCount: number;
    commentCount: number;
    createDate: string;
}

export interface SearchPostsResponse {
    result: number;
    errors: null;
    message: string;
    data: {
        pageNumber: number;
        pageSize: number;
        firstPage: number;
        lastPage: number;
        totalPages: number;
        totalRecords: number;
        nextPage: number | null;
        previousPage: number | null;
        data: SearchPost[];
    };
}

export interface SearchHistory {
    id: number;
    userId: number;
    searchType: number;
    searchText: string | null;
    targetUserId: number | null;
    targetHashtagId: number | null;
    targetPostId: number | null;
    status: number;
    createDate: string;
    targetUser: {
        id: number;
        firstName: string;
        lastName: string;
        fullName: string;
        email: string;
        avatarUrl: string | null;
        userName: string | null;
    } | null;
    targetHashtag: {
        id: number;
        code: string;
        tag: string;
        normalized: string;
    } | null;
    targetPost: any | null;
}

export interface SearchHistoriesResponse {
    result: number;
    errors: null;
    message: string;
    data: {
        pageNumber: number;
        pageSize: number;
        firstPage: number;
        lastPage: number;
        totalPages: number;
        totalRecords: number;
        nextPage: number | null;
        previousPage: number | null;
        data: SearchHistory[];
    };
}

export class SearchService {
    static async searchUsers(keyword: string, pageNumber: number = 0, pageSize: number = 10): Promise<SearchUsersResponse> {
        const response = await httpClient.get<SearchUsersResponse>('/api/v1/social/search/users', {
            params: {
                keyword,
                pageNumber,
                pageSize
            }
        });
        return response.data;
    }

    static async searchPosts(Keyword?: string, pageNumber: number = 0, pageSize: number = 10): Promise<SearchPostsResponse> {
        const response = await httpClient.get<SearchPostsResponse>('/api/v1/social/posts', {
            params: {
                Keyword,
                pageNumber,
                pageSize
            }
        });
        return response.data;
    }

    static async getSearchHistories(pageNumber: number = 0, pageSize: number = 10): Promise<SearchHistoriesResponse> {
        const response = await httpClient.get<SearchHistoriesResponse>('/api/v1/social/search/histories', {
            params: {
                pageNumber,
                pageSize
            }
        });
        return response.data;
    }

    static async saveSearchHistory(searchText: string, targetUserId?: number, hashtagText?: string): Promise<any> {
        const response = await httpClient.post('/api/v1/social/search/save-history', {
            searchText,
            targetUserId,
            hashtagText
        });
        return response.data;
    }

    static async searchFeed(keyword: string, pageNumber: number = 0, pageSize: number = 10): Promise<any> {
        const response = await httpClient.get('/api/v1/social/feed', {
            params: {
                keyword,
                feedType: 30,
                pageNumber,
                pageSize
            }
        });
        return response;
    }
}
