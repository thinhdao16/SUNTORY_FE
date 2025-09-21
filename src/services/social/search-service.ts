import httpClient from '@/config/http-client';

export interface SearchUser {
    id: number;
    fullName: string;
    username: string;
    avatar: string;
    isVerified?: boolean;
    postCount?: number;
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

export class SearchService {
    static async searchUsers(keyword: string, pageNumber: number = 1, pageSize: number = 10): Promise<SearchUsersResponse> {
        const response = await httpClient.get<SearchUsersResponse>('/api/v1/social/search/users', {
            params: {
                keyword,
                pageNumber,
                pageSize
            }
        });
        return response.data;
    }

    static async searchPosts(hashtag?: string, pageNumber: number = 1, pageSize: number = 10): Promise<SearchPostsResponse> {
        const response = await httpClient.get<SearchPostsResponse>('/api/v1/social/posts', {
            params: {
                hashtag,
                pageNumber,
                pageSize
            }
        });
        return response.data;
    }
}
