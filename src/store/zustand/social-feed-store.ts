import { create } from 'zustand';
import { SocialPost } from '@/types/social-feed';

interface SocialFeedStore {
  // Current post detail data
  currentPost: SocialPost | null;
  
  // Feed posts list
  feedPosts: SocialPost[];
  
  // Loading states
  isLoadingPostDetail: boolean;
  
  // Error states
  postDetailError: string | null;
  
  // Actions
  setCurrentPost: (post: SocialPost | null) => void;
  setIsLoadingPostDetail: (loading: boolean) => void;
  setPostDetailError: (error: string | null) => void;
  clearCurrentPost: () => void;
  
  // Feed posts actions
  setFeedPosts: (posts: SocialPost[]) => void;
  updatePostReaction: (postId: number, isLiked: boolean, reactionCount: number) => void;
  optimisticUpdatePostReaction: (postId: number) => void;
}

export const useSocialFeedStore = create<SocialFeedStore>((set, get) => ({
  // Initial state
  currentPost: null,
  feedPosts: [],
  isLoadingPostDetail: false,
  postDetailError: null,
  
  // Actions
  setCurrentPost: (post) => set({ currentPost: post }),
  setIsLoadingPostDetail: (loading) => set({ isLoadingPostDetail: loading }),
  setPostDetailError: (error) => set({ postDetailError: error }),
  clearCurrentPost: () => set({ 
    currentPost: null, 
    isLoadingPostDetail: false, 
    postDetailError: null 
  }),
  
  // Feed posts actions
  setFeedPosts: (posts) => set({ feedPosts: posts }),
  
  updatePostReaction: (postId, isLiked, reactionCount) => set((state) => ({
    feedPosts: state.feedPosts.map(post => 
      post.id === postId 
        ? { ...post, isLike: isLiked, reactionCount }
        : post
    ),
    currentPost: state.currentPost?.id === postId 
      ? { ...state.currentPost, isLike: isLiked, reactionCount }
      : state.currentPost
  })),
  
  optimisticUpdatePostReaction: (postId) => set((state) => ({
    feedPosts: state.feedPosts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLike: !post.isLike,
            reactionCount: post.isLike ? post.reactionCount - 1 : post.reactionCount + 1
          }
        : post
    ),
    currentPost: state.currentPost?.id === postId 
      ? { 
          ...state.currentPost, 
          isLike: !state.currentPost.isLike,
          reactionCount: state.currentPost.isLike ? state.currentPost.reactionCount - 1 : state.currentPost.reactionCount + 1
        }
      : state.currentPost
  })),
}));
