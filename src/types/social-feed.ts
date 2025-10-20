// Social Feed Types
export interface SocialUser {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  userName: string | null;
}

export interface SocialHashtag {
  id: number;
  code: string;
  tag: string;
  normalized: string;
}

export interface SocialMediaFile {
  id: number;
  s3BucketName: string;
  s3Key: string;
  s3Region: string | null;
  fileType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  fileName: string;
  isPublic: number;
  urlFile: string;
}

export interface SocialPost {
  id: number;
  code: string;
  userId: number;
  content: string;
  isRepost: boolean;
  isRepostedByCurrentUser?: boolean;
  originalPostId: number | null;
  captionRepost: string | null;
  privacy: number;
  isPin: boolean;
  status: number;
  createDate: string;
  user: SocialUser;
  media: SocialMediaFile[];
  hashtags: SocialHashtag[];
  reactionCount: number;
  commentCount: number;
  repostCount: number;
  shareCount: number;
  isLike: boolean;
  originalPost: SocialPost | null;
  lastScore?: number;
  score?: number;
  isFriend: boolean;
  friendRequest?: {
    id?: any;
    fromUserId?: number;
    toUserId?: number;
    status?: number;
    createDate?: string;
  } ;
}

export interface PaginationInfo {
  pageNumber: number;
  pageSize: number;
  firstPage: number;
  lastPage: number;
  totalPages: number;
  totalRecords: number;
  nextPage: boolean;
  previousPage: boolean;
}

export interface SocialPostsResponse {
  result: number;
  errors: string | null;
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
    data: SocialPost[];
  };
}

export interface PostsQueryParams {
  privacy?: number;
  pageNumber: number;
  pageSize: number;
}
