import { create } from 'zustand';

export interface ProfilePost {
  code: string;
  reactionCount: number;
  commentCount?: number;
  repostCount?: number;
  shareCount?: number;
  isLike?: boolean;
  originalPost?: ProfilePost | null;
  [key: string]: any;
}

interface CachedProfileList {
  posts: ProfilePost[];
  currentPage: number;
  hasNextPage: boolean;
  totalPages: number;
  totalRecords: number;
  scrollPosition?: number;
}

interface ProfilePostsStore {
  cachedProfiles: Record<string, CachedProfileList>;
  activeProfileKey: string;

  // basic helpers
  setActiveProfileKey: (key: string) => void;
  setPaginationInfo: (info: { currentPage: number; hasNextPage: boolean; totalPages: number; totalRecords: number }, key?: string) => void;

  // posts
  setPosts: (posts: ProfilePost[], key?: string) => void;
  appendPosts: (posts: ProfilePost[], key?: string) => void;

  // selectors
  getPosts: (key?: string) => ProfilePost[];

  // mutations
  removePost: (code: string) => void;
  updatePostReaction: (code: string, isLiked: boolean, reactionCount: number) => void;
  optimisticUpdatePostReaction: (code: string) => void;
  applyPatch: (code: string, patch: Partial<ProfilePost>) => void;

  // scroll helpers
  saveScrollPosition: (position: number, key?: string) => void;
  getScrollPosition: (key?: string) => number;
  clearScrollPosition: (key?: string) => void;

  reset: () => void;
}

export const generateProfileKey = (tabType: number, targetUserId?: number) => `tab-${tabType}-${targetUserId ?? 'self'}`;

export const useProfilePostsStore = create<ProfilePostsStore>((set, get) => ({
  cachedProfiles: {},
  activeProfileKey: 'tab-10-self',

  setActiveProfileKey: (key) => {
    const curr = get().activeProfileKey;
    if (curr === key) return;
    set({ activeProfileKey: key });
  },

  setPaginationInfo: (info, key) => {
    const state = get();
    const k = key || state.activeProfileKey;
    const current = state.cachedProfiles[k];
    if (!current) return;
    set({
      cachedProfiles: {
        ...state.cachedProfiles,
        [k]: {
          ...current,
          currentPage: info.currentPage,
          hasNextPage: info.hasNextPage,
          totalPages: info.totalPages,
          totalRecords: info.totalRecords,
        },
      },
    });
  },

  setPosts: (posts, key) => {
    const state = get();
    const k = key || state.activeProfileKey;
    const existing = state.cachedProfiles[k]?.posts;
    if (existing && existing.length === posts.length) {
      // Skip only if code sequence is identical (order + members)
      const a = existing.map((p) => p.code).join('|');
      const b = posts.map((p) => p.code).join('|');
      if (a === b) return;
    }
    set({
      cachedProfiles: {
        ...state.cachedProfiles,
        [k]: {
          posts,
          currentPage: 1,
          hasNextPage: true,
          totalPages: 0,
          totalRecords: posts.length,
        },
      },
    });
  },

  appendPosts: (posts, key) => {
    const state = get();
    const k = key || state.activeProfileKey;
    const current = state.cachedProfiles[k];
    if (!current) {
      set({
        cachedProfiles: {
          ...state.cachedProfiles,
          [k]: {
            posts,
            currentPage: 1,
            hasNextPage: true,
            totalPages: 0,
            totalRecords: posts.length,
          },
        },
      });
      return;
    }
    const existingCodes = new Set(current.posts.map((p) => p.code));
    const newPosts = posts.filter((p) => !existingCodes.has(p.code));
    if (newPosts.length === 0) return;
    set({
      cachedProfiles: {
        ...state.cachedProfiles,
        [k]: {
          ...current,
          posts: [...current.posts, ...newPosts],
          currentPage: current.currentPage + 1,
          totalRecords: current.totalRecords + newPosts.length,
        },
      },
    });
  },

  getPosts: (key) => {
    const state = get();
    const k = key || state.activeProfileKey;
    return state.cachedProfiles[k]?.posts || [];
  },

  removePost: (code) => {
    const state = get();
    const updated = { ...state.cachedProfiles };
    Object.keys(updated).forEach((k) => {
      const list = updated[k]?.posts || [];
      const filtered = list.filter((p) => p.code !== code);
      if (filtered.length !== list.length) {
        updated[k] = {
          ...updated[k],
          posts: filtered,
          totalRecords: Math.max(0, (updated[k]?.totalRecords || 0) - 1),
        } as CachedProfileList;
      }
    });
    set({ cachedProfiles: updated });
  },

  updatePostReaction: (code, isLiked, reactionCount) => {
    const state = get();
    const updated = { ...state.cachedProfiles };
    Object.keys(updated).forEach((k) => {
      const curr = updated[k];
      if (!curr) return;
      updated[k] = {
        ...curr,
        posts: curr.posts.map((p) => (p.code === code ? { ...p, isLike: isLiked, reactionCount } : p)),
      };
    });
    set({ cachedProfiles: updated });
  },

  optimisticUpdatePostReaction: (code) => {
    const state = get();
    const updated = { ...state.cachedProfiles };
    Object.keys(updated).forEach((k) => {
      const curr = updated[k];
      if (!curr) return;
      updated[k] = {
        ...curr,
        posts: curr.posts.map((p) => (p.code === code ? { ...p, isLike: !p.isLike, reactionCount: (p.isLike ? Math.max(0, (p.reactionCount || 0) - 1) : (p.reactionCount || 0) + 1) } : p)),
      };
    });
    set({ cachedProfiles: updated });
  },

  applyPatch: (code, patch) => {
    const state = get();
    const updated = { ...state.cachedProfiles };
    Object.keys(updated).forEach((k) => {
      const curr = updated[k];
      if (!curr) return;
      updated[k] = {
        ...curr,
        posts: curr.posts.map((p) => {
          if (p.code === code) {
            const merged: ProfilePost = { ...p, ...patch } as ProfilePost;
            if (p.originalPost && p.originalPost.code === code) {
              merged.originalPost = { ...p.originalPost, ...patch } as ProfilePost;
            }
            return merged;
          }
          if (p.originalPost && p.originalPost.code === code) {
            return {
              ...p,
              repostCount: (patch.repostCount ?? p.repostCount) as number,
              reactionCount: (patch.reactionCount ?? p.reactionCount) as number,
              commentCount: (patch.commentCount ?? p.commentCount) as number,
              shareCount: (patch.shareCount ?? p.shareCount) as number,
              isRepostedByCurrentUser: (patch as any).isRepostedByCurrentUser ?? (p as any).isRepostedByCurrentUser,
              originalPost: { ...p.originalPost, ...patch } as ProfilePost,
            } as ProfilePost;
          }
          return p;
        }),
      };
    });
    set({ cachedProfiles: updated });
  },

  saveScrollPosition: (position, key) => {
    const state = get();
    const k = key || state.activeProfileKey;
    const curr = state.cachedProfiles[k];
    if (!curr) return;
    set({
      cachedProfiles: {
        ...state.cachedProfiles,
        [k]: { ...curr, scrollPosition: position },
      },
    });
  },

  getScrollPosition: (key) => {
    const state = get();
    const k = key || state.activeProfileKey;
    return state.cachedProfiles[k]?.scrollPosition || 0;
  },

  clearScrollPosition: (key) => {
    const state = get();
    const k = key || state.activeProfileKey;
    const curr = state.cachedProfiles[k];
    if (!curr) return;
    set({
      cachedProfiles: {
        ...state.cachedProfiles,
        [k]: { ...curr, scrollPosition: 0 },
      },
    });
  },

  reset: () => set({ cachedProfiles: {}, activeProfileKey: 'tab-10-self' }),
}));
