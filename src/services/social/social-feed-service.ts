import httpClient from '@/config/http-client';
import { PostsQueryParams, SocialPostsResponse, SocialPost } from '@/types/social-feed';

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

    static async getPostById(postId: number): Promise<SocialPost> {
        const response = await httpClient.get<{ data: SocialPost }>(
            `${this.BASE_URL}/${postId}`
        );
        return response.data.data;
    }

    static async reactToPost(postId: number, reactionTypeId: number | null = null, isRemove: boolean = false): Promise<void> {
        const payload: any = {
            postId,
            isRemove
        };
        if (reactionTypeId !== null) {
            payload.reactionTypeId = reactionTypeId;
        }
        
        await httpClient.post('/api/v1/social/post/react', payload);
    }

    static async likePost(postId: number, hasExistingReaction: boolean = false): Promise<void> {
        if (hasExistingReaction) {
            return this.reactToPost(postId, 1, true);
        } else {
            return this.reactToPost(postId, 1, false);
        }
    }

    static async unlikePost(postId: number): Promise<void> {
        return this.reactToPost(postId, 1, true);
    }
}
