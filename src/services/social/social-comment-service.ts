import httpClient from '@/config/http-client';

export interface CreateCommentRequest {
  postCode: string;
  replyCommentId?: number;
  content: string;
  mediaFilenames?: string[];
}

export interface SocialComment {
  id: number;
  code: string;
  postId: number;
  userId: number;
  replyCommentId?: number;
  content: string;
  isEdited: boolean;
  isDeleted: boolean;
  status: number;
  createDate: string;
  updateDate?: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
    userName?: string;
  };
  media: Array<{
    id: number;
    url: string;
    type: 'image' | 'video' | 'audio';
  }>;
  commentMentions: any[];
  reactionCount: number;
  replyCount: number;
  isLike?: boolean;
}

export class SocialCommentService {
  static async createComment(data: CreateCommentRequest): Promise<SocialComment> {
    const response = await httpClient.post('/api/v1/social/comment', data);
    return response.data;
  }

  static async getCommentsByPostCode(postCode: string, pageNumber: number = 0, pageSize: number = 20): Promise<{
    pageNumber: number;
    pageSize: number;
    firstPage: number;
    lastPage: number;
    totalPages: number;
    totalRecords: number;
    nextPage: boolean;
    previousPage: boolean;
    data: SocialComment[];
  }> {
    const response = await httpClient.get('/api/v1/social/comments', {
      params: { 
        PostCode: postCode,
        PageNumber: pageNumber,
        PageSize: pageSize
      }
    });
    return response.data.data;
  }

  static async likeComment(commentId: number): Promise<void> {
    await httpClient.post(`/api/v1/social/comment/${commentId}/like`);
  }

  static async unlikeComment(commentId: number): Promise<void> {
    await httpClient.delete(`/api/v1/social/comment/${commentId}/like`);
  }
}
