import { create } from 'zustand';
import { SocialPost } from '@/types/social-feed';

interface FeedParams {
  feedType?: number;
  hashtagNormalized?: string;
  pageSize: number;
}

interface CachedFeed {
  posts: SocialPost[];
  currentPage: number;
  hasNextPage: boolean;
  totalPages: number;
  totalRecords: number;
  scrollPosition?: number;
}

interface SocialFeedStore {
  // Current post detail data
  currentPost: SocialPost | null;
  
  // Cached feeds by key (feedType-hashtag)
  cachedFeeds: Record<string, CachedFeed>;
  
  // Current active feed key
  activeFeedKey: string;
  
  // Feed parameters
  feedParams: FeedParams;
  
  // Loading states
  isLoadingPostDetail: boolean;
  isLoadingFeed: boolean;
  isLoadingMore: boolean;
  
  // Error states
  postDetailError: string | null;
  feedError: string | null;
  
  // Actions
  setCurrentPost: (post: SocialPost | null) => void;
  setIsLoadingPostDetail: (loading: boolean) => void;
  setPostDetailError: (error: string | null) => void;
  clearCurrentPost: () => void;
  
  // Feed posts actions
  setFeedPosts: (posts: SocialPost[], feedKey?: string) => void;
  appendFeedPosts: (posts: SocialPost[], feedKey?: string) => void;
  getFeedPosts: (feedKey?: string) => SocialPost[];
  clearFeedPosts: (feedKey?: string) => void;
  removePostFromFeeds: (postCode: string) => void;
  updatePostReaction: (postCode: string, isLiked: boolean, reactionCount: number) => void;
  optimisticUpdatePostReaction: (postCode: string) => void;
  applyRealtimePatch: (postCode: string, patch: Partial<SocialPost>) => void;
  
  // Scroll position actions
  saveScrollPosition: (position: number, feedKey?: string) => void;
  getScrollPosition: (feedKey?: string) => number;
  clearScrollPosition: (feedKey?: string) => void;
  
  // Feed state actions
  setFeedParams: (params: FeedParams) => void;
  setFeedLoading: (loading: boolean) => void;
  setLoadingMore: (loading: boolean) => void;
  setFeedError: (error: string | null) => void;
  setPaginationInfo: (info: { currentPage: number; hasNextPage: boolean; totalPages: number; totalRecords: number }, feedKey?: string) => void;
  setActiveFeedKey: (key: string) => void;
  resetFeedState: () => void;
}

// Helper function to generate feed key
const generateFeedKey = (feedType?: number, hashtagNormalized?: string): string => {
  return `${feedType || 'all'}-${hashtagNormalized || 'none'}`;
};

export const useSocialFeedStore = create<SocialFeedStore>((set, get) => ({
  // Initial state
  currentPost: null,
  cachedFeeds: {},
  activeFeedKey: 'all-none',
  feedParams: { pageSize: 20 },
  isLoadingPostDetail: false,
  isLoadingFeed: false,
  isLoadingMore: false,
  postDetailError: null,
  feedError: null,
  
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
  setFeedPosts: (posts, feedKey) => {
    const state = get();
    const key = feedKey || state.activeFeedKey;
    set({
      cachedFeeds: {
        ...state.cachedFeeds,
        [key]: {
          posts,
          currentPage: 1,
          hasNextPage: true,
          totalPages: 0,
          totalRecords: posts.length
        }
      }
    });
  },
  
  appendFeedPosts: (posts, feedKey) => {
    const state = get();
    const key = feedKey || state.activeFeedKey;
    const currentFeed = state.cachedFeeds[key];
    
    if (!currentFeed) {
      // If no existing feed, create new one
      set({
        cachedFeeds: {
          ...state.cachedFeeds,
          [key]: {
            posts,
            currentPage: 1,
            hasNextPage: true,
            totalPages: 0,
            totalRecords: posts.length
          }
        }
      });
      return;
    }
    
    // Filter out duplicates
    const existingCodes = new Set(currentFeed.posts.map((post: SocialPost) => post.code));
    const newPosts = posts.filter((post: SocialPost) => !existingCodes.has(post.code));
    
    set({
      cachedFeeds: {
        ...state.cachedFeeds,
        [key]: {
          ...currentFeed,
          posts: [...currentFeed.posts, ...newPosts],
          currentPage: currentFeed.currentPage + 1,
          totalRecords: currentFeed.totalRecords + newPosts.length
        }
      }
    });
  },
  
  getFeedPosts: (feedKey) => {
    const state = get();
    const key = feedKey || state.activeFeedKey;
    return state.cachedFeeds[key]?.posts || [];
  },
  
  clearFeedPosts: (feedKey) => {
    const state = get();
    const key = feedKey || state.activeFeedKey;
    set({
      cachedFeeds: {
        ...state.cachedFeeds,
        [key]: {
          posts: [],
          currentPage: 0,
          hasNextPage: false,
          totalPages: 0,
          totalRecords: 0
        }
      }
    });
  },

  removePostFromFeeds: (postCode: string) => {
    const state = get();
    const updatedFeeds = { ...state.cachedFeeds };
    
    // Efficiently remove post from all feeds
    Object.keys(updatedFeeds).forEach(key => {
      const feed = updatedFeeds[key];
      if (feed && feed.posts) {
        const filteredPosts = feed.posts.filter(post => post.code !== postCode);
        if (filteredPosts.length !== feed.posts.length) {
          updatedFeeds[key] = {
            ...feed,
            posts: filteredPosts,
            totalRecords: Math.max(0, feed.totalRecords - 1)
          };
        }
      }
    });
    
    set({
      cachedFeeds: updatedFeeds,
      currentPost: state.currentPost?.code === postCode ? null : state.currentPost
    });
  },
  
  updatePostReaction: (postCode, isLiked, reactionCount) => {
    const state = get();
    const updatedFeeds = { ...state.cachedFeeds };

    // Update in all cached feeds
    Object.keys(updatedFeeds).forEach(key => {
      updatedFeeds[key] = {
        ...updatedFeeds[key],
        posts: updatedFeeds[key].posts.map((post: SocialPost) => 
          post.code === postCode 
            ? { ...post, isLike: isLiked, reactionCount }
            : post
        )
      };
    });
    
    set({
      cachedFeeds: updatedFeeds,
      currentPost: state.currentPost?.code === postCode 
        ? { ...state.currentPost, isLike: isLiked, reactionCount }
        : state.currentPost
    });
  },

  optimisticUpdatePostReaction: (postCode) => {
    const state = get();
    const updatedFeeds = { ...state.cachedFeeds };
    
    // Update in all cached feeds
    Object.keys(updatedFeeds).forEach(key => {
      updatedFeeds[key] = {
        ...updatedFeeds[key],
        posts: updatedFeeds[key].posts.map((post: SocialPost) => {
          if (post.code !== postCode) return post;
          const wasLiked = Boolean(post.isLike);
          const prevCount = (post.reactionCount ?? 0);
          const nextCount = wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1;
          return { ...post, isLike: !wasLiked, reactionCount: nextCount };
        })
      };
    });
    
    set({
      cachedFeeds: updatedFeeds,
      currentPost: state.currentPost?.code === postCode 
        ? {
            ...state.currentPost,
            isLike: !Boolean(state.currentPost.isLike),
            reactionCount: Boolean(state.currentPost.isLike)
              ? Math.max(0, (state.currentPost.reactionCount ?? 0) - 1)
              : (state.currentPost.reactionCount ?? 0) + 1
          }
        : state.currentPost
    });
  },

  applyRealtimePatch: (postCode, patch) => {
    if (!postCode) return;
    const state = get();

    const mergePost = (post: SocialPost) => ({
      ...post,
      ...patch,
      originalPost: post.originalPost && post.originalPost.code === postCode
        ? { ...post.originalPost, ...patch }
        : post.originalPost,
    });

    const updatedFeeds = Object.keys(state.cachedFeeds).reduce((acc, key) => {
      const feed = state.cachedFeeds[key];
      if (!feed) {
        acc[key] = feed;
        return acc;
      }
      acc[key] = {
        ...feed,
        posts: feed.posts.map((post: SocialPost) => {
          if (post.code === postCode) {
            // Direct match: merge into the post itself (and nested original if same)
            return mergePost(post);
          }
          // If this is a repost card whose original matches the target code, update nested original
          if (post.originalPost && post.originalPost.code === postCode) {
            return {
              ...post,
              // Propagate key counters/flags to top-level so UI reads stay in sync
              repostCount: (patch as any)?.repostCount ?? post.repostCount,
              reactionCount: (patch as any)?.reactionCount ?? post.reactionCount,
              commentCount: (patch as any)?.commentCount ?? post.commentCount,
              shareCount: (patch as any)?.shareCount ?? post.shareCount,
              isRepostedByCurrentUser: (patch as any)?.isRepostedByCurrentUser ?? post.isRepostedByCurrentUser,
              originalPost: { ...post.originalPost, ...patch },
            } as SocialPost;
          }
          return post;
        }),
      };
      return acc;
    }, {} as Record<string, CachedFeed | undefined>) as Record<string, CachedFeed>;

    // Sync currentPost as well (detail page)
    const curr = state.currentPost;
    let newCurrent = curr;
    if (curr?.code === postCode) {
      newCurrent = mergePost(curr);
    } else if (curr?.originalPost && curr.originalPost.code === postCode) {
      newCurrent = {
        ...curr,
        repostCount: (patch as any)?.repostCount ?? curr.repostCount,
        reactionCount: (patch as any)?.reactionCount ?? curr.reactionCount,
        commentCount: (patch as any)?.commentCount ?? curr.commentCount,
        shareCount: (patch as any)?.shareCount ?? curr.shareCount,
        isRepostedByCurrentUser: (patch as any)?.isRepostedByCurrentUser ?? curr.isRepostedByCurrentUser,
        originalPost: { ...curr.originalPost, ...patch },
      } as SocialPost;
    }

    set({
      cachedFeeds: updatedFeeds,
      currentPost: newCurrent,
    });
  },

  // Feed state actions
  setFeedParams: (params) => set({ feedParams: params }),
  setFeedLoading: (loading) => set({ isLoadingFeed: loading }),
  setLoadingMore: (loading) => set({ isLoadingMore: loading }),
  setFeedError: (error) => set({ feedError: error }),
  
  setPaginationInfo: (info, feedKey) => {
    const state = get();
    const key = feedKey || state.activeFeedKey;
    const currentFeed = state.cachedFeeds[key];
    
    if (currentFeed) {
      set({
        cachedFeeds: {
          ...state.cachedFeeds,
          [key]: {
            ...currentFeed,
            currentPage: info.currentPage,
            hasNextPage: info.hasNextPage,
            totalPages: info.totalPages,
            totalRecords: info.totalRecords
          }
        }
      });
    }
  },
  
  setActiveFeedKey: (key) => set({ activeFeedKey: key }),
  
  // Scroll position actions
  saveScrollPosition: (position, feedKey) => {
    const state = get();
    const key = feedKey || state.activeFeedKey;
    const currentFeed = state.cachedFeeds[key];
    
    if (currentFeed) {
      set({
        cachedFeeds: {
          ...state.cachedFeeds,
          [key]: {
            ...currentFeed,
            scrollPosition: position
          }
        }
      });
    } else {
      // Create a placeholder feed entry to store scroll position for custom keys (e.g., search pages)
      set({
        cachedFeeds: {
          ...state.cachedFeeds,
          [key]: {
            posts: [],
            currentPage: 0,
            hasNextPage: false,
            totalPages: 0,
            totalRecords: 0,
            scrollPosition: position
          }
        }
      });
    }
  },
  
  getScrollPosition: (feedKey) => {
    const state = get();
    const key = feedKey || state.activeFeedKey;
    return state.cachedFeeds[key]?.scrollPosition || 0;
  },
  
  clearScrollPosition: (feedKey) => {
    const state = get();
    const key = feedKey || state.activeFeedKey;
    const currentFeed = state.cachedFeeds[key];
    
    if (currentFeed) {
      set({
        cachedFeeds: {
          ...state.cachedFeeds,
          [key]: {
            ...currentFeed,
            scrollPosition: 0
          }
        }
      });
    }
  },
  
  resetFeedState: () => set({
    cachedFeeds: {},
    activeFeedKey: 'all-none',
    isLoadingFeed: false,
    isLoadingMore: false,
    feedError: null
  }),
}));

// Export helper function
export { generateFeedKey };
