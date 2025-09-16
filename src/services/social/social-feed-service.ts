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
    name: string;
    count?: number;
}

export interface HashtagInterestsResponse {
    data: HashtagInterest[];
    success: boolean;
    message?: string;
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
            privacy
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
        try {
            const response = await httpClient.get<HashtagInterestsResponse>(
                '/api/v1/social/hashtag/interests'
            );
            return response.data;
        } catch (error: any) {
            console.error('Get hashtag interests failed:', error);
            return {
                success: false,
                data: [],
                message: error.response?.data?.message || 'Failed to fetch hashtag interests'
            };
        }
    }

    static async getFeedWithLastPostCode(
        lastPostCode?: string,
        pageSize: number = 10,
        feedType?: number,
        hashtagNormalized?: string
    ): Promise<{ data: SocialPost[] }> {
        const queryParams = new URLSearchParams();
        
        if (feedType !== undefined) {
            queryParams.append('FeedType', feedType.toString());
        }
        if (hashtagNormalized) {
            queryParams.append('HashtagNormalized', hashtagNormalized);
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
}
