/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import ENV from "@/config/env";
import { useAuthStore } from "@/store/zustand/auth-store";
import { useQueryClient } from 'react-query';
import { useSocialFeedStore } from '@/store/zustand/social-feed-store';
import { SocialPost } from '@/types/social-feed';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { useSearchResultsStore } from '@/store/zustand/search-results-store';
import { useProfilePostsStore } from '@/store/zustand/profile-posts-store';

export interface UsePostSignalROptions {
    postId?: string;
    autoConnect?: boolean;
    enableDebugLogs?: boolean;
    preferWebSockets?: boolean;
    onPostUpdated?: (data: any) => void;
    onPostCreated?: (data: any) => void;
    onCommentAdded?: (data: any) => void;
    onCommentUpdated?: (data: any) => void;
    onCommentDeleted?: (data: any) => void;
    onPostLiked?: (data: any) => void;
    onPostUnliked?: (data: any) => void;
    onCommentLiked?: (data: any) => void;
    onCommentUnliked?: (data: any) => void;
}

export function usePostSignalR(
    deviceId: string,
    options: UsePostSignalROptions
) {
    const {
        postId,
        autoConnect = true,
        enableDebugLogs = false,
        preferWebSockets = true,
        onPostUpdated,
        onPostCreated,
        onCommentAdded,
        onCommentUpdated,
        onCommentDeleted,
        onPostLiked,
        onPostUnliked,
        onCommentLiked,
        onCommentUnliked,
    } = options;

    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const isConnectedRef = useRef(false);
    const startedRef = useRef(false);
    const connectingRef = useRef(false);
    const startPromiseRef = useRef<Promise<void> | null>(null);
    const joinedPostsRef = useRef<Set<string>>(new Set());
    const refreshTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const { isAuthenticated } = useAuthStore();
    const queryClient = useQueryClient();

    const log = useCallback(
        (message: string, ...args: any[]) => {
            if (enableDebugLogs) console.log(`[SignalR:Post] ${message}`, ...args);
        },
        [enableDebugLogs]
    );

    const buildConnection = useCallback(() => {
        const token = () => localStorage.getItem("token") || "";
        const b = new signalR.HubConnectionBuilder().configureLogging(signalR.LogLevel.Warning);
        b.withUrl(`${ENV.BE}/chatHub?deviceId=${deviceId}`, {
            accessTokenFactory: token,
            ...(preferWebSockets
                ? { transport: signalR.HttpTransportType.WebSockets, skipNegotiation: true }
                : {}),
        });
        
        b.withAutomaticReconnect({
            nextRetryDelayInMilliseconds: (retryContext) => {
                const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
                log(`Reconnect attempt ${retryContext.previousRetryCount + 1}, delay: ${delay}ms`);
                return delay;
            }
        });
        
        b.withServerTimeout(60000);
        b.withKeepAliveInterval(15000);
        
        return b.build();
    }, [deviceId, preferWebSockets, log]);

    const joinPostUpdates = useCallback(async (postCode: string) => {
        const conn = connectionRef.current;
        if (!conn || conn.state !== signalR.HubConnectionState.Connected) return false;
        if (joinedPostsRef.current.has(postCode)) return true;

        try {
            await conn.invoke("JoinPostUpdates", postCode);
            joinedPostsRef.current.add(postCode);
            console.log(`Joined post updates for: ${postCode}`);
            return true;
        } catch (e) {
            log("JoinPostUpdates failed", e);
            return false;
        }
    }, [log]);

    const leavePostUpdates = useCallback(async (postCode: string) => {
        const conn = connectionRef.current;
        if (!conn || conn.state !== signalR.HubConnectionState.Connected) {
            joinedPostsRef.current.delete(postCode);
            log(`Connection not available, removed ${postCode} from local tracking`);
            return false;
        }
        if (!joinedPostsRef.current.has(postCode)) return true;

        try {
            await conn.invoke("LeavePostUpdates", postCode);
            joinedPostsRef.current.delete(postCode);
            log(`Left post updates for: ${postCode}`);
            return true;
        } catch (e) {
            log("LeavePostUpdates failed", e);
            joinedPostsRef.current.delete(postCode);
            return false;
        }
    }, [log]);

    const resolveCodesFromPayload = useCallback((payload: any) => {
        const codes = new Set<string>();
        if (!payload) return { primary: null as string | null, codes: [] as string[] };

        if (payload.originalPostCode) codes.add(payload.originalPostCode);
        if (payload.postCode) codes.add(payload.postCode);
        if (payload?.post?.code) codes.add(payload.post.code);
        if (payload?.repostData?.code) codes.add(payload.repostData.code);
        if (payload?.repostData?.originalPost?.code) codes.add(payload.repostData.originalPost.code);
        if (payload?.post?.originalPost?.code) codes.add(payload.post.originalPost.code);

        const orderedCodes = Array.from(codes).filter(Boolean) as string[];
        const primary = payload.originalPostCode
            || payload.postCode
            || payload?.post?.code
            || payload?.repostData?.originalPost?.code
            || orderedCodes[0]
            || null;

        return { primary, codes: orderedCodes };
    }, []);

    const applyPatchSafe = useCallback((codes: string[], payload: any) => {
        if (!payload || !codes.length) return null as Partial<SocialPost> | null;

        const source = payload.post ?? payload.repostData ?? payload;
        const patch: Partial<SocialPost> = {};

        const assignIfDefined = (key: keyof SocialPost, value?: unknown) => {
            const val = value !== undefined ? value : source?.[key];
            if (val !== undefined) {
                patch[key] = val as any;
            }
        };

        assignIfDefined('reactionCount', payload.reactionCount);
        assignIfDefined('commentCount', payload.commentCount);
        assignIfDefined('repostCount', payload.repostCount);
        assignIfDefined('shareCount', payload.shareCount);
        assignIfDefined('content');
        assignIfDefined('media');
        assignIfDefined('hashtags');
        assignIfDefined('isLike');

        if (payload.comment && payload.commentCount !== undefined) {
            patch.commentCount = payload.commentCount;
        }

        if (Object.keys(patch).length === 0) return null;

        const patcher = useSocialFeedStore.getState().applyRealtimePatch;
        codes.forEach(code => patcher(code, patch));
        return patch;
    }, []);

    // Build a shallow patch without mutating feed store (for Search cache)
    const buildPatchForSearch = useCallback((payload: any) => {
        if (!payload) return null as Partial<SocialPost> | null;
        const source = payload.post ?? payload.repostData ?? payload;
        const patch: Partial<SocialPost> = {};
        const assignIfDefined = (key: keyof SocialPost, value?: unknown) => {
            const val = value !== undefined ? value : source?.[key];
            if (val !== undefined) {
                patch[key] = val as any;
            }
        };
        assignIfDefined('reactionCount', payload.reactionCount);
        assignIfDefined('commentCount', payload.commentCount);
        assignIfDefined('repostCount', payload.repostCount);
        assignIfDefined('shareCount', payload.shareCount);
        assignIfDefined('content');
        assignIfDefined('media');
        assignIfDefined('hashtags');
        assignIfDefined('isLike');
        return Object.keys(patch).length ? patch : null;
    }, []);

    const applyPatchToSearchCache = useCallback((codes: string[], payload: any) => {
        const patch = buildPatchForSearch(payload);
        if (!patch || !codes.length) return;
        const apply = useSearchResultsStore.getState().applyPostPatch;
        codes.forEach(code => apply(code, patch));
    }, [buildPatchForSearch]);

    const applyPatchToQueryCache = useCallback((codes: string[], patch: Partial<SocialPost> | null) => {
        if (!patch || !codes.length) return;

        codes.forEach(code => {
            queryClient.setQueryData(['feedDetail', code], (old: any) => {
                if (!old) return old;
                return { ...old, ...patch };
            });
        });
    }, [queryClient]);

    // Patch across all userPosts queries (Profile tabs) so profile lists stay in sync in real time
    const applyPatchToUserPostsCaches = useCallback((codes: string[], patch: Partial<SocialPost> | null) => {
        if (!patch || !codes.length) return;
        const matching = queryClient.getQueriesData(['userPosts']) as Array<[any, any]>;
        // Also patch the profile posts store so Profile lists update in real time
        try {
            const applyProfile = useProfilePostsStore.getState().applyPatch;
            codes.forEach(code => applyProfile(code, patch));
        } catch {}
        matching.forEach(([qk, old]) => {
            if (!old?.pages) return;
            try {
                const newData = {
                    ...old,
                    pages: old.pages.map((page: any) => {
                        if (!page?.data) return page;
                        const list = Array.isArray(page.data?.data) ? page.data.data : [];
                        if (!list.length) return page;
                        const updated = list.map((p: any) => codes.includes(p?.code) ? { ...p, ...patch } : p);
                        return { ...page, data: { ...page.data, data: updated } };
                    }),
                };
                queryClient.setQueryData(qk as any, newData);
            } catch {}
        });
    }, [queryClient]);

    const applyCommentUpdate = useCallback((postCode: string, commentData: any, action: 'add' | 'update' | 'delete') => {
        if (!postCode || !commentData) return;

        queryClient.setQueryData(['comments', postCode], (old: any) => {
            if (!old?.pages) return old;

            const pages = old.pages.map((page: any) => {
                if (!page?.data) return page;

                let updatedData = [...page.data];

                switch (action) {
                    case 'add':
                        updatedData = [commentData, ...updatedData];
                        break;
                    case 'update':
                        updatedData = updatedData.map((comment: any) => 
                            comment.id === commentData.id ? { ...comment, ...commentData } : comment
                        );
                        break;
                    case 'delete':
                        updatedData = updatedData.filter((comment: any) => comment.id !== commentData.id);
                        break;
                }

                return { ...page, data: updatedData };
            });

            return { ...old, pages };
        });
    }, [queryClient]);

    const schedulePostRefresh = useCallback((postCode: string, delay = 600) => {
        if (!postCode) return;
        const existing = refreshTimeoutsRef.current.get(postCode);
        if (existing) {
            clearTimeout(existing);
        }
        const timer = setTimeout(async () => {
            refreshTimeoutsRef.current.delete(postCode);
            try {
                const fresh = await SocialFeedService.getPostByCode(postCode);
                useSocialFeedStore.getState().applyRealtimePatch(postCode, fresh);
            } catch (error) {
                log(`Refresh post ${postCode} failed`, error);
            }
        }, delay);
        refreshTimeoutsRef.current.set(postCode, timer);
    }, [log]);

    const attachHandlers = useCallback((connection: signalR.HubConnection) => {
        connection.off("PostUpdated");
        connection.on("PostUpdated", (data: any) => {
            console.log("PostUpdated received:", data);
            if (data.type === 25) {
                console.log("Post deleted:", data.postCode);
                const postCode = data.postCode;
                joinedPostsRef.current.delete(postCode);
                const timeout = refreshTimeoutsRef.current.get(postCode);
                if (timeout) {
                    clearTimeout(timeout);
                    refreshTimeoutsRef.current.delete(postCode);
                }
                useSocialFeedStore.getState().removePostFromFeeds(postCode);
                queryClient.invalidateQueries(['feedDetail', postCode]);
                // Also remove from Search caches and userPosts paginated caches
                try {
                    useSearchResultsStore.getState().removePost(postCode);
                    const matchingUserPostQueries = queryClient.getQueriesData(['userPosts']) as Array<[any, any]>;
                    matchingUserPostQueries.forEach(([qk, old]) => {
                        if (!old?.pages) return;
                        const newData = {
                            ...old,
                            pages: old.pages.map((page: any) => {
                                if (!page?.data) return page;
                                const prevList = Array.isArray(page.data?.data) ? page.data.data : [];
                                const filtered = prevList.filter((p: any) => p?.code !== postCode);
                                if (filtered === prevList) return page;
                                return { ...page, data: { ...page.data, data: filtered } };
                            }),
                        };
                        queryClient.setQueryData(qk as any, newData);
                    });
                } catch {}
                onPostUpdated?.(data);
                return;
            }
            if (data.type === 45) {
                console.log("New post created:", data);
                // Handle asynchronously so we can fetch missing post data if needed
                void (async () => {
                    let newPost = data.post || data.repostData;
                    // Fallback: fetch the created/reposted post when payload doesn't include it
                    if (!newPost) {
                        try {
                            if (data.repostId) {
                                newPost = await SocialFeedService.getPostById(data.repostId);
                            } else if (data.repostCode) {
                                newPost = await SocialFeedService.getPostByCode(data.repostCode);
                            } else if (data.postCode) {
                                // Some backends return postCode for the new post
                                newPost = await SocialFeedService.getPostByCode(data.postCode);
                            }
                        } catch (e) {
                            log("Failed to fetch created/reposted post", e);
                        }
                    }

                    if (newPost) {
                        const store = useSocialFeedStore.getState();
                        // Append the new post into all cached feeds to keep UI responsive
                        Object.keys(store.cachedFeeds).forEach(feedKey => {
                            const currentFeed = store.cachedFeeds[feedKey];
                            if (currentFeed && currentFeed.posts) {
                                // Append to end to avoid jumping viewport
                                store.appendFeedPosts([newPost], feedKey);
                            }
                        });

                        // Update Profile Reposts tab caches for the owner of the new post
                        try {
                            const ownerId = newPost.userId;
                            const PROFILE_TAB_REPOSTS = 40; // see ProfileTabType.Reposts
                            const matching = queryClient.getQueriesData(['userPosts']) as Array<[any, any]>;
                            matching.forEach(([qk, old]) => {
                                if (!old?.pages?.length || !Array.isArray(qk)) return;
                                const tabType = qk[1];
                                const targetUserId = qk[2];
                                const isRepostsTab = tabType === PROFILE_TAB_REPOSTS;
                                const isTargetUser = !targetUserId || Number(targetUserId) === Number(ownerId);
                                if (!isRepostsTab || !isTargetUser) return;
                                try {
                                    const firstPage = old.pages[0];
                                    const list = Array.isArray(firstPage?.data?.data) ? firstPage.data.data : [];
                                    const deduped = list.filter((p: any) => p?.code !== newPost.code);
                                    const updatedFirst = { ...firstPage, data: { ...firstPage.data, data: [newPost, ...deduped] } };
                                    const newData = { ...old, pages: [updatedFirst, ...old.pages.slice(1)] };
                                    queryClient.setQueryData(qk as any, newData);
                                } catch {}
                            });
                        } catch {}

                        // If this was a repost, ensure the original post's counter is not reset to 0
                        if (data.originalPostCode && data.interactionType === 50) {
                            const originalPostCode = data.originalPostCode as string;
                            try {
                                if (typeof data.repostCount === 'number' && Number.isFinite(data.repostCount)) {
                                    store.applyRealtimePatch(originalPostCode, { repostCount: data.repostCount } as any);
                                } else {
                                    // Compute prev + 1 from any cached entry
                                    const state = useSocialFeedStore.getState();
                                    let prevCount: number | undefined;
                                    Object.keys(state.cachedFeeds).forEach(key => {
                                        (state.cachedFeeds[key]?.posts || []).forEach((p: any) => {
                                            if (p?.code === originalPostCode || p?.originalPost?.code === originalPostCode) {
                                                if (prevCount === undefined) prevCount = p?.repostCount;
                                            }
                                        });
                                    });
                                    const next = Math.max(0, (prevCount ?? 0) + 1);
                                    store.applyRealtimePatch(originalPostCode, { repostCount: next } as any);
                                }
                                queryClient.invalidateQueries(['feedDetail', originalPostCode]);
                                // Also patch all profile userPosts caches so lists reflect the increment immediately
                                try {
                                    const matching = queryClient.getQueriesData(['userPosts']) as Array<[any, any]>;
                                    matching.forEach(([qk, old]) => {
                                        if (!old?.pages) return;
                                        try {
                                            let foundPrev: number | undefined;
                                            // derive next value if not provided by payload
                                            const nextRepost = typeof data.repostCount === 'number' && Number.isFinite(data.repostCount)
                                                ? data.repostCount
                                                : (() => {
                                                    old.pages.forEach((page: any) => {
                                                        if (!page?.data) return;
                                                        const list = Array.isArray(page.data?.data) ? page.data.data : [];
                                                        list.forEach((p: any) => { if (p?.code === originalPostCode && foundPrev === undefined) foundPrev = p?.repostCount; });
                                                    });
                                                    return Math.max(0, (foundPrev ?? 0) + 1);
                                                })();
                                            const newData = {
                                                ...old,
                                                pages: old.pages.map((page: any) => {
                                                    if (!page?.data) return page;
                                                    const list = Array.isArray(page.data?.data) ? page.data.data : [];
                                                    if (!list.length) return page;
                                                    const updated = list.map((p: any) => p?.code === originalPostCode ? { ...p, repostCount: nextRepost } : p);
                                                    return { ...page, data: { ...page.data, data: updated } };
                                                }),
                                            };
                                            queryClient.setQueryData(qk as any, newData);
                                        } catch {}
                                    });
                                } catch {}
                            } catch {}
                        }
                    } else {
                        // As a last resort, if we couldn't construct the new post, at least refresh the original counter
                        if (data.originalPostCode && data.interactionType === 50) {
                            try {
                                const fresh = await SocialFeedService.getPostByCode(data.originalPostCode);
                                useSocialFeedStore.getState().applyRealtimePatch(data.originalPostCode, { repostCount: (fresh as any)?.repostCount } as any);
                            } catch {}
                        }
                    }

                    onPostCreated?.(data);
                    onPostUpdated?.(data);
                })();
                return;
            }
            const { primary, codes } = resolveCodesFromPayload(data);
            // Always update Search caches and Profile caches
            applyPatchToSearchCache(codes, data);
            const userPatch = buildPatchForSearch(data);
            applyPatchToUserPostsCaches(codes, userPatch);
            // Only patch feed caches when joined (visible) to reduce work
            if (primary && joinedPostsRef.current.has(primary)) {
                const patch = applyPatchSafe(codes, data);
                applyPatchToQueryCache(codes, patch);
                // If this update looks like a reaction update, skip scheduling refresh.
                const looksLikeReaction = (
                    data?.reactionCount !== undefined ||
                    data?.isLike !== undefined ||
                    data?.post?.reactionCount !== undefined ||
                    data?.post?.isLike !== undefined
                );
                if (!looksLikeReaction) {
                    schedulePostRefresh(primary);
                }
                // Removed immediate invalidate to avoid double refetch
            }
            onPostUpdated?.(data);
        });

        connection.off("CommentAdded");
        connection.on("CommentAdded", (data: any) => {
            console.log("CommentAdded received:", data);
            const { primary, codes } = resolveCodesFromPayload(data);
            // Update Search and Profile caches regardless of join state
            applyPatchToSearchCache(codes, data);
            applyPatchToUserPostsCaches(codes, buildPatchForSearch(data));
            if (!primary || !joinedPostsRef.current.has(primary)) return;
            
            if (data.comment) {
                applyCommentUpdate(primary, data.comment, 'add');
            }
            
            const patch = applyPatchSafe(codes, data);
            applyPatchToQueryCache(codes, patch);
            schedulePostRefresh(primary);
            onCommentAdded?.(data);
        });

        connection.off("CommentUpdated");
        connection.on("CommentUpdated", (data: any) => {
            console.log("CommentUpdated received:", data);
            const { primary, codes } = resolveCodesFromPayload(data);
            applyPatchToSearchCache(codes, data);
            if (!primary || !joinedPostsRef.current.has(primary)) return;
            
            if (data.comment) {
                applyCommentUpdate(primary, data.comment, 'update');
            }
            
            const patch = applyPatchSafe(codes, data);
            applyPatchToQueryCache(codes, patch);
            schedulePostRefresh(primary);
            queryClient.invalidateQueries(['comments', primary]);
            onCommentUpdated?.(data);
        });

        connection.off("CommentDeleted");
        connection.on("CommentDeleted", (data: any) => {
            console.log("CommentDeleted received:", data);
            const { primary, codes } = resolveCodesFromPayload(data);
            applyPatchToSearchCache(codes, data);
            if (!primary || !joinedPostsRef.current.has(primary)) return;
            
            if (data.comment || data.commentId) {
                const commentToDelete = data.comment || { id: data.commentId };
                applyCommentUpdate(primary, commentToDelete, 'delete');
            }
            
            const patch = applyPatchSafe(codes, data);
            applyPatchToQueryCache(codes, patch);
            schedulePostRefresh(primary);
            queryClient.invalidateQueries(['comments', primary]);
            onCommentDeleted?.(data);
        });

        connection.off("PostLiked");
        connection.on("PostLiked", (data: any) => {
            console.log("PostLiked received:", data);
            const { primary, codes } = resolveCodesFromPayload(data);
            applyPatchToSearchCache(codes, data);
            applyPatchToUserPostsCaches(codes, buildPatchForSearch(data));
            if (primary && joinedPostsRef.current.has(primary)) {
                const patch = applyPatchSafe(codes, data);
                applyPatchToQueryCache(codes, patch);
                // Do not schedule a detail refresh for like events; single source of truth is the mutation success.
            }
            onPostLiked?.(data);
        });

        connection.off("PostUnliked");
        connection.on("PostUnliked", (data: any) => {
            console.log("PostUnliked received:", data);
            const { primary, codes } = resolveCodesFromPayload(data);
            applyPatchToSearchCache(codes, data);
            applyPatchToUserPostsCaches(codes, buildPatchForSearch(data));
            if (primary && joinedPostsRef.current.has(primary)) {
                const patch = applyPatchSafe(codes, data);
                applyPatchToQueryCache(codes, patch);
                // Do not schedule a detail refresh for unlike events; single source of truth is the mutation success.
            }
            onPostUnliked?.(data);
        });

        connection.off("CommentLiked");
        connection.on("CommentLiked", (data: any) => {
            console.log("CommentLiked received:", data);
            if (data?.userId === useAuthStore.getState().user?.id) return;
            const { primary, codes } = resolveCodesFromPayload(data);
            applyPatchToSearchCache(codes, data);
            if (!primary || !joinedPostsRef.current.has(primary)) return;
            if (data.comment) {
                const updatedComment = {
                    ...data.comment,
                    reactionCount: data.reactionCount || data.comment.reactionCount,
                    isLike: data.isLike !== undefined ? data.isLike : data.comment.isLike
                };
                applyCommentUpdate(primary, updatedComment, 'update');
            }
            
            const patch = applyPatchSafe(codes, data);
            applyPatchToQueryCache(codes, patch);
            schedulePostRefresh(primary);
            queryClient.invalidateQueries(['comments', primary]);
            onCommentLiked?.(data);
        });

        connection.off("CommentUnliked");
        connection.on("CommentUnliked", (data: any) => {
            log("CommentUnliked received:", data);
            if (data?.userId === useAuthStore.getState().user?.id) return;
            const { primary, codes } = resolveCodesFromPayload(data);
            applyPatchToSearchCache(codes, data);
            if (!primary || !joinedPostsRef.current.has(primary)) return;
            if (data.comment) {
                const updatedComment = {
                    ...data.comment,
                    reactionCount: data.reactionCount || data.comment.reactionCount,
                    isLike: data.isLike !== undefined ? data.isLike : data.comment.isLike
                };
                applyCommentUpdate(primary, updatedComment, 'update');
            }
            
            const patch = applyPatchSafe(codes, data);
            applyPatchToQueryCache(codes, patch);
            schedulePostRefresh(primary);
            queryClient.invalidateQueries(['comments', primary]);
            onCommentUnliked?.(data);
        });

        connection.off("PostReposted");
        connection.on("PostReposted", (data: any) => {
            console.log("PostReposted received:", data);
            const { primary, codes } = resolveCodesFromPayload({ ...data, postCode: data?.originalPostCode });
            // Always keep Search and Profile caches in sync
            const patchForCaches = { ...data, postCode: primary };
            applyPatchToSearchCache(codes, patchForCaches);
            const userPatch = buildPatchForSearch(patchForCaches);
            applyPatchToUserPostsCaches(codes, userPatch);

            // Fallback: if payload didn't include repostCount, increment by 1 in userPosts caches
            if (primary && (userPatch === null || (userPatch && (userPatch as any).repostCount === undefined))) {
                try {
                    const matching = queryClient.getQueriesData(['userPosts']) as Array<[any, any]>;
                    matching.forEach(([qk, old]) => {
                        if (!old?.pages) return;
                        try {
                            let prev: number | undefined;
                            old.pages.forEach((page: any) => {
                                if (!page?.data) return;
                                const list = Array.isArray(page.data?.data) ? page.data.data : [];
                                list.forEach((p: any) => { if (p?.code === primary && prev === undefined) prev = p?.repostCount; });
                            });
                            const next = Math.max(0, (prev ?? 0) + 1);
                            const newData = {
                                ...old,
                                pages: old.pages.map((page: any) => {
                                    if (!page?.data) return page;
                                    const list = Array.isArray(page.data?.data) ? page.data.data : [];
                                    if (!list.length) return page;
                                    const updated = list.map((p: any) => p?.code === primary ? { ...p, repostCount: next } : p);
                                    return { ...page, data: { ...page.data, data: updated } };
                                }),
                            };
                            queryClient.setQueryData(qk as any, newData);
                        } catch {}
                    });
                } catch {}
            }

            // IMPORTANT: Update feed store across all cached feeds regardless of join state
            // so Everyone/Hashtag/Friends lists reflect repostCount increments consistently for all users.
            const patch = applyPatchSafe(codes, patchForCaches);
            // Optionally sync feedDetail cache when available (cheap)
            applyPatchToQueryCache(codes, patch);

            // Only schedule network refresh if user is actively viewing this post (no immediate invalidate)
            if (primary && joinedPostsRef.current.has(primary)) {
                schedulePostRefresh(primary);
            }
            onPostUpdated?.(data);
        });

        connection.onreconnecting((err) => {
            isConnectedRef.current = false;
            log("Reconnecting...", err);
        });

        connection.onreconnected(async (id) => {
            isConnectedRef.current = true;
            log("Reconnected:", id);
            
            const postsToRejoin = Array.from(joinedPostsRef.current);
            joinedPostsRef.current.clear();
            
            for (const postCode of postsToRejoin) {
                try {
                    await joinPostUpdates(postCode);
                    log(`Rejoined post updates for: ${postCode}`);
                } catch (error) {
                    log(`Failed to rejoin post updates for ${postCode}:`, error);
                }
            }
        });

        connection.onclose((err) => {
            isConnectedRef.current = false;
            joinedPostsRef.current.clear();
            log("Closed:", err);
        });
    }, [
        queryClient,
        log,
        onPostUpdated,
        onCommentAdded,
        onCommentUpdated,
        onCommentDeleted,
        onPostLiked,
        onPostUnliked,
        onCommentLiked,
        onCommentUnliked,
        joinPostUpdates,
        applyPatchSafe,
        applyPatchToQueryCache,
    ]);

    const connect = useCallback(async () => {
        const curr = connectionRef.current;
        if (curr) {
            const s = curr.state;
            if (
                s === signalR.HubConnectionState.Connected ||
                s === signalR.HubConnectionState.Connecting ||
                s === signalR.HubConnectionState.Reconnecting
            ) {
                return startPromiseRef.current ?? Promise.resolve();
            }
        }
        if (connectingRef.current) {
            return startPromiseRef.current ?? Promise.resolve();
        }

        const conn = buildConnection();
        connectionRef.current = conn;
        attachHandlers(conn);

        connectingRef.current = true;
        const p = conn
            .start()
            .then(async () => {
                isConnectedRef.current = true;
                startedRef.current = true;
                log("Connected:", conn.connectionId);
                if (postId) {
                    await joinPostUpdates(postId);
                }
            })
            .finally(() => {
                connectingRef.current = false;
            });

        startPromiseRef.current = p;
        return p;
    }, [attachHandlers, buildConnection, joinPostUpdates, log, postId]);

    const stop = useCallback(async () => {
        const conn = connectionRef.current;
        if (!conn) return;
        try {
            if (conn.state === signalR.HubConnectionState.Connected) {
                const joinedPosts = Array.from(joinedPostsRef.current);
                log(`Stopping khi xóa  thì LeavePostUpdates cho signal`, joinedPosts);
                
                const leavePromises = joinedPosts.map(code => 
                    leavePostUpdates(code).catch(error => {
                        log(`Failed to leave post updates for ${code}:`, error);
                        return false;
                    })
                );
                await Promise.allSettled(leavePromises);
            } else {
                log("Connection not connected, skipping LeavePostUpdates calls");
                joinedPostsRef.current.clear();
            }
            
            await conn.stop();
        } catch (error) {
            log("Error during stop:", error);
        } finally {
            connectionRef.current = null;
            isConnectedRef.current = false;
            startedRef.current = false;
            joinedPostsRef.current.clear();
            refreshTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
            refreshTimeoutsRef.current.clear();
            log("Stopped");
        }
    }, [log, leavePostUpdates]);

    useEffect(() => {
        if (autoConnect && isAuthenticated && !startedRef.current) {
            void connect();
        }
        return () => { void stop(); };
    }, [autoConnect, isAuthenticated, postId]);

    useEffect(() => {
        if (!postId) return;
        void joinPostUpdates(postId);
        return () => { void leavePostUpdates(postId); };
    }, [postId, joinPostUpdates, leavePostUpdates]);

    useEffect(() => {
        const onOnline = () => {
            if (connectionRef.current?.state === signalR.HubConnectionState.Disconnected) void connect();
        };
        const onVisible = () => {
            if (
                document.visibilityState === "visible" &&
                connectionRef.current?.state === signalR.HubConnectionState.Disconnected
            ) {
                void connect();
            }
        };
        window.addEventListener("online", onOnline);
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            window.removeEventListener("online", onOnline);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [connect]);

    return {
        startConnection: connect,
        stopConnection: stop,
        isConnected: isConnectedRef.current,
        joinedPosts: Array.from(joinedPostsRef.current),
        connectionId: connectionRef.current?.connectionId,
        joinPostUpdates,
        leavePostUpdates,
    };
}
