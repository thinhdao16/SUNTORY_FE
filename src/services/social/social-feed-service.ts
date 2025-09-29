import httpClient from '@/config/http-client';
import { PostsQueryParams, SocialPostsResponse, SocialPost } from '@/types/social-feed';

export interface FeedQueryParams {
    feedType?: number;
    hashtagNormalized?: string;
    pageNumber: number;
    pageSize: number;
}

export interface CreatePostRequest {
    content: string;
    mediaFilenames?: string[];
    hashtags?: string[];
    privacy: number;
}

export interface UpdatePostRequest {
    postCode: string;
    content: string;
    mediaFilenames?: string[];
    hashtags?: string[];
    privacy: number;
}

export interface CreatePostResponse {
    success: boolean;
    data?: {
        id: string;
        content: string;
        mediaFilenames: string[];
        hashtags: string[];
        privacy: number[];
        createdAt: string;
    };
    message?: string;
}

export interface HashtagInterest {
    id: number;
    hashtagId: number;
    hashtagCode: string;
    hashtagTag: string;
    hashtagNormalized: string;
    createDate: string;
    updateDate: string;
    lastInterestDate: string;
}

export interface HashtagInterestsResponse {
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
        nextPage: boolean;
        previousPage: boolean;
        data: HashtagInterest[];
    };
}

export const createSocialPost = async (postData: CreatePostRequest): Promise<CreatePostResponse> => {
    try {
        const response = await httpClient.post('/api/v1/social/post', postData);
        return {
            success: true,
            data: response.data
        };
    } catch (error: any) {
        console.error('Create post failed:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to create post'
        };
    }
};

export const updateSocialPost = async (postData: UpdatePostRequest): Promise<CreatePostResponse> => {
    try {
        const response = await httpClient.put(`/api/v1/social/post`, postData);
        return {
            success: true,
            data: response.data
        };
    } catch (error: any) {
        console.error('Update post failed:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to update post'
        };
    }
};

export const deleteSocialPost = async (postCode: string): Promise<{ success: boolean; message?: string }> => {
    try {
        await httpClient.delete(`/api/v1/social/post/${postCode}`);
        return {
            success: true
        };
    } catch (error: any) {
        console.error('Delete post failed:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to delete post'
        };
    }
};

export class SocialFeedService {
    private static readonly BASE_URL = '/api/v1/social/posts';
    private static readonly FEED_URL = '/api/v1/social/feed';

    static async getPosts(params: PostsQueryParams): Promise<SocialPostsResponse> {
        const queryParams = new URLSearchParams();
        if (params.privacy !== undefined) {
            queryParams.append('Privacy', params.privacy.toString());
        }
        queryParams.append('PageNumber', params.pageNumber.toString());
        queryParams.append('PageSize', params.pageSize.toString());

        const response = await httpClient.get<SocialPostsResponse>(
            `${this.BASE_URL}?${queryParams.toString()}`
        );

        return response.data;
    }

    static async getFeed(params: FeedQueryParams): Promise<SocialPostsResponse> {
        const queryParams = new URLSearchParams();
        if (params.feedType !== undefined) {
            queryParams.append('FeedType', params.feedType.toString());
        }
        if (params.hashtagNormalized) {
            queryParams.append('HashtagNormalized', params.hashtagNormalized);
        }
        queryParams.append('PageNumber', params.pageNumber.toString());
        queryParams.append('PageSize', params.pageSize.toString());

        const response = await httpClient.get<SocialPostsResponse>(
            `${this.FEED_URL}?${queryParams.toString()}`
        );

        return response.data;
    }

    static async getPostsInfinite(
        pageNumber: number,
        pageSize: number = 10,
        privacy?: number
    ): Promise<SocialPostsResponse> {
        return this.getPosts({
            pageNumber,
            pageSize,
            privacy
        });
    }

    static async getFeedInfinite(
        pageNumber: number,
        pageSize: number = 10,
        feedType?: number,
        hashtagNormalized?: string
    ): Promise<SocialPostsResponse> {
        return this.getFeed({
            pageNumber,
            pageSize,
            feedType,
            hashtagNormalized
        });
    }

    static async getPostById(postId: number): Promise<SocialPost> {
        const response = await httpClient.get<{ data: SocialPost }>(
            `${this.BASE_URL}/${postId}`
        );
        return response.data.data;
    }

    static async getPostByCode(postCode: string): Promise<SocialPost> {
        const response = await httpClient.get<{ data: SocialPost }>(
            `/api/v1/social/post/${postCode}`
        );
        return response.data.data;
    }

    static async reactToPost(postCode: string, reactionTypeId: number | null = null, isRemove: boolean = false): Promise<void> {
        const payload: any = {
            postCode,
            isRemove
        };
        if (reactionTypeId !== null) {
            payload.reactionTypeId = reactionTypeId;
        }
        
        await httpClient.post('/api/v1/social/post/react', payload);
    }

    static async likePost(postCode: string, hasExistingReaction: boolean = false): Promise<void> {
        if (hasExistingReaction) {
            return this.reactToPost(postCode, 1, true);
        } else {
            return this.reactToPost(postCode, 1, false);
        }
    }

    static async unlikePost(postCode: string): Promise<void> {
        return this.reactToPost(postCode, 1, true);
    }

    static async repostPost(originalPostCode: string, captionRepost: string, privacy: number): Promise<void> {
        const payload = {
            originalPostCode,
            captionRepost,
            privacy,
        };
        
        await httpClient.post('/api/v1/social/post/repost', payload);
    }

    static async reactToComment(commentCode: string, reactionTypeId: number | null = null, isRemove: boolean = false): Promise<void> {
        const payload: any = {
            commentCode,
            isRemove
        };
        if (reactionTypeId !== null) {
            payload.reactionTypeId = reactionTypeId;
        }
        
        await httpClient.post('/api/v1/social/comment/react', payload);
    }

    static async likeComment(commentCode: string, hasExistingReaction: boolean = false): Promise<void> {
        if (hasExistingReaction) {
            return this.reactToComment(commentCode, 1, true);
        } else {
            return this.reactToComment(commentCode, 1, false);
        }
    }

    static async unlikeComment(commentCode: string): Promise<void> {
        return this.reactToComment(commentCode, 1, true);
    }

    static async getHashtagInterests(): Promise<HashtagInterestsResponse> {
        const response = await httpClient.get<HashtagInterestsResponse>(
            '/api/v1/social/hashtag/interests'
        );
        return response.data;
    }

    static async deleteHashtagInterest(hashtagText: string): Promise<void> {
        await httpClient.delete('/api/v1/social/hashtag/interest', {
            data: { hashtagText }
        });
    }

    static async getFeedWithLastPostCode(
        lastPostCode?: string,
        pageSize: number = 10,
        feedType?: number,
        hashtagNormalized?: string,
        keyword?: string
    ): Promise<{ data: SocialPost[] }> {
        const queryParams = new URLSearchParams();
        
        if (feedType !== undefined) {
            queryParams.append('FeedType', feedType.toString());
        }
        if (hashtagNormalized && hashtagNormalized.length > 0) {
            queryParams.append('HashtagNormalized', hashtagNormalized);
        } else if (keyword && keyword.length > 0) {
            queryParams.append('Keyword', keyword);
        }
        if (lastPostCode) {
            queryParams.append('LastPostCode', lastPostCode);
        }
        queryParams.append('Take', pageSize.toString());

        const response = await httpClient.get<{ data: SocialPost[] }>(
            `/api/v1/social/feed?${queryParams.toString()}`
        );

        return response.data;
    }

    static async trackHashtagInterest(hashtagText: string): Promise<void> {
        await httpClient.post('/api/v1/social/hashtag/interest', {
            hashtagText
        });
    }
}
