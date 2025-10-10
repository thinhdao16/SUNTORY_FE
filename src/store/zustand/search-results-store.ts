import { create } from 'zustand';
import { SearchUser } from '@/services/social/search-service';

export type SearchTab = 'all' | 'latest' | 'people' | 'posts';

export interface SearchResultsTabState {
  users: SearchUser[];
  posts: any[];
  isLoading: boolean;
  hasMore: boolean;
  currentPage: number; // used by 'all', 'people', 'posts'
  lastPostCode?: string; // used by 'latest'
  error?: string | null;
  scrollPosition?: number;
}

interface SearchResultsStore {
  cached: Record<string, SearchResultsTabState>;
  // helpers
  generateKey: (tab: SearchTab, query: string) => string;
  ensureKey: (key: string) => void;
  getResults: (key: string) => SearchResultsTabState | undefined;
  setResults: (key: string, partial: Partial<SearchResultsTabState>) => void;
  replaceUsers: (key: string, users: SearchUser[]) => void;
  appendUsers: (key: string, users: SearchUser[]) => void;
  replacePosts: (key: string, posts: any[]) => void;
  appendPosts: (key: string, posts: any[]) => void;
  setHasMore: (key: string, hasMore: boolean) => void;
  setCurrentPage: (key: string, page: number) => void;
  setLastPostCode: (key: string, code?: string) => void;
  setLoading: (key: string, loading: boolean) => void;
  setError: (key: string, error: string | null) => void;
  // scroll
  saveScrollPosition: (key: string, position: number) => void;
  getScrollPosition: (key: string) => number;
  // reaction updates across all cached posts
  updatePostReaction: (postCode: string, isLiked: boolean, reactionCount: number) => void;
  optimisticUpdatePostReaction: (postCode: string) => void;
  // realtime helpers
  removePost: (postCode: string) => void;
  applyPostPatch: (postCode: string, patch: Partial<any>) => void;
}

const defaultState = (): SearchResultsTabState => ({
  users: [],
  posts: [],
  isLoading: false,
  hasMore: true,
  currentPage: 0,
  lastPostCode: undefined,
  error: null,
  scrollPosition: 0,
});

export const generateSearchKey = (tab: SearchTab, query: string) => {
  const q = (query || '').trim();
  return `search:${tab}:${q}`;
};

export const useSearchResultsStore = create<SearchResultsStore>((set, get) => ({
  cached: {},
  generateKey: generateSearchKey,
  ensureKey: (key) => {
    const state = get();
    if (!state.cached[key]) {
      set({ cached: { ...state.cached, [key]: defaultState() } });
    }
  },
  getResults: (key) => {
    return get().cached[key];
  },
  setResults: (key, partial) => {
    const state = get();
    const prev = state.cached[key] || defaultState();
    set({ cached: { ...state.cached, [key]: { ...prev, ...partial } } });
  },
  replaceUsers: (key, users) => {
    const state = get();
    const prev = state.cached[key] || defaultState();
    set({ cached: { ...state.cached, [key]: { ...prev, users } } });
  },
  appendUsers: (key, users) => {
    const state = get();
    const prev = state.cached[key] || defaultState();
    set({ cached: { ...state.cached, [key]: { ...prev, users: [...prev.users, ...users] } } });
  },
  replacePosts: (key, posts) => {
    const state = get();
    const prev = state.cached[key] || defaultState();
    set({ cached: { ...state.cached, [key]: { ...prev, posts } } });
  },
  appendPosts: (key, posts) => {
    const state = get();
    const prev = state.cached[key] || defaultState();
    // Update existing posts with same code and append truly new ones
    const incomingMap = new Map<string, any>(
      (posts || []).map((p: any) => [p?.code, p])
    );
    const updatedExisting = (prev.posts || []).map((p: any) =>
      incomingMap.has(p.code) ? { ...p, ...incomingMap.get(p.code) } : p
    );
    const existingCodes = new Set(updatedExisting.map((p: any) => p.code));
    const newOnes = (posts || []).filter((p: any) => p && !existingCodes.has(p.code));
    set({
      cached: {
        ...state.cached,
        [key]: { ...prev, posts: [...updatedExisting, ...newOnes] }
      }
    });
  },
  setHasMore: (key, hasMore) => {
    const state = get();
    const prev = state.cached[key] || defaultState();
    set({ cached: { ...state.cached, [key]: { ...prev, hasMore } } });
  },
  setCurrentPage: (key, page) => {
    const state = get();
    const prev = state.cached[key] || defaultState();
    set({ cached: { ...state.cached, [key]: { ...prev, currentPage: page } } });
  },
  setLastPostCode: (key, code) => {
    const state = get();
    const prev = state.cached[key] || defaultState();
    set({ cached: { ...state.cached, [key]: { ...prev, lastPostCode: code } } });
  },
  setLoading: (key, loading) => {
    const state = get();
    const prev = state.cached[key] || defaultState();
    set({ cached: { ...state.cached, [key]: { ...prev, isLoading: loading } } });
  },
  setError: (key, error) => {
    const state = get();
    const prev = state.cached[key] || defaultState();
    set({ cached: { ...state.cached, [key]: { ...prev, error } } });
  },
  saveScrollPosition: (key, position) => {
    const state = get();
    const prev = state.cached[key] || defaultState();
    set({ cached: { ...state.cached, [key]: { ...prev, scrollPosition: position } } });
  },
  getScrollPosition: (key) => {
    const s = get().cached[key];
    return s?.scrollPosition || 0;
  },
  updatePostReaction: (postCode, isLiked, reactionCount) => {
    const state = get();
    const updated: Record<string, SearchResultsTabState> = {};
    for (const [key, value] of Object.entries(state.cached)) {
      updated[key] = {
        ...value,
        posts: (value.posts || []).map(p => p.code === postCode ? { ...p, isLike: isLiked, reactionCount } : p)
      };
    }
    set({ cached: updated });
  },
  optimisticUpdatePostReaction: (postCode) => {
    const state = get();
    const updated: Record<string, SearchResultsTabState> = {};
    for (const [key, value] of Object.entries(state.cached)) {
      updated[key] = {
        ...value,
        posts: (value.posts || []).map(p => p.code === postCode ? { ...p, isLike: !p.isLike, reactionCount: p.isLike ? p.reactionCount - 1 : p.reactionCount + 1 } : p)
      };
    }
    set({ cached: updated });
  },

  // Remove a post by code from all cached tabs/queries
  removePost: (postCode) => {
    const state = get();
    const updated: Record<string, SearchResultsTabState> = {};
    for (const [key, value] of Object.entries(state.cached)) {
      updated[key] = {
        ...value,
        posts: (value.posts || []).filter(p => p.code !== postCode)
      };
    }
    set({ cached: updated });
  },

  // Apply a shallow patch to a post by code across all cached tabs/queries
  applyPostPatch: (postCode, patch) => {
    const state = get();
    // Remove undefined values to prevent overwriting with undefined
    const safePatch = Object.fromEntries(
      Object.entries(patch || {}).filter(([, v]) => v !== undefined)
    );
    if (Object.keys(safePatch).length === 0) return;
    const updated: Record<string, SearchResultsTabState> = {};
    for (const [key, value] of Object.entries(state.cached)) {
      updated[key] = {
        ...value,
        posts: (value.posts || []).map(p => p.code === postCode ? { ...p, ...safePatch } : p)
      };
    }
    set({ cached: updated });
  }
}));
