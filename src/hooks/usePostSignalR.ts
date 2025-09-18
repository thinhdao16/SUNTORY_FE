/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import ENV from "@/config/env";
import { useAuthStore } from "@/store/zustand/auth-store";
import { useQueryClient } from 'react-query';
import { useSocialFeedStore } from '@/store/zustand/social-feed-store';
import { SocialPost } from '@/types/social-feed';
import { SocialFeedService } from '@/services/social/social-feed-service';

export interface UsePostSignalROptions {
    postId?: string;
    autoConnect?: boolean;
    enableDebugLogs?: boolean;
    preferWebSockets?: boolean;
    onPostUpdated?: (data: any) => void;
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
        b.withAutomaticReconnect([0, 2000, 10000, 30000]);
        return b.build();
    }, [deviceId, preferWebSockets]);

    const joinPostUpdates = useCallback(async (postCode: string) => {
        const conn = connectionRef.current;
        if (!conn || conn.state !== signalR.HubConnectionState.Connected) return false;
        if (joinedPostsRef.current.has(postCode)) return true;

        try {
            await conn.invoke("JoinPostUpdates", postCode);
            joinedPostsRef.current.add(postCode);
            log(`Joined post updates for: ${postCode}`);
            return true;
        } catch (e) {
            log("JoinPostUpdates failed", e);
            return false;
        }
    }, [log]);

    const leavePostUpdates = useCallback(async (postCode: string) => {
        const conn = connectionRef.current;
        if (!conn || conn.state !== signalR.HubConnectionState.Connected) {
            // If connection is not available, just remove from local tracking
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
            // Still remove from local tracking even if server call failed
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

    const applyPatchToQueryCache = useCallback((codes: string[], patch: Partial<SocialPost> | null) => {
        if (!patch || !codes.length) return;

        codes.forEach(code => {
            queryClient.setQueryData(['feedDetail', code], (old: any) => {
                if (!old) return old;
                return { ...old, ...patch };
            });
        });

        // queryClient.setQueriesData<{ pages?: Array<{ data?: SocialPost[] }> }>(
        //     { predicate: ({ queryKey }) => Array.isArray(queryKey) && queryKey[0] === 'socialFeed' },
        //     (old) => {
        //         if (!old?.pages) return old;
        //         const pages = old.pages.map(page => {
        //             if (!page?.data) return page;
        //             const data = page.data.map(post => codes.includes(post.code) ? { ...post, ...patch } : post);
        //             return { ...page, data };
        //         });
        //         return { ...old, pages };
        //     }
        // );

        // queryClient.setQueriesData<{ pages?: Array<{ data?: SocialPost[] }> }>(
        //     { predicate: ({ queryKey }) => Array.isArray(queryKey) && queryKey[0] === 'socialFeedPosts' },
        //     (old) => {
        //         if (!old?.pages) return old;
        //         const pages = old.pages.map(page => {
        //             if (!page?.data) return page;
        //             const data = page.data.map(post => codes.includes(post.code) ? { ...post, ...patch } : post);
        //             return { ...page, data };
        //         });
        //         return { ...old, pages };
        //     }
        // );
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
            const { primary, codes } = resolveCodesFromPayload(data);
            if (!primary || !joinedPostsRef.current.has(primary)) return;
            const patch = applyPatchSafe(codes, data);
            applyPatchToQueryCache(codes, patch);
            schedulePostRefresh(primary);
            queryClient.invalidateQueries(['feedDetail', primary]);
            onPostUpdated?.(data);
        });

        connection.off("CommentAdded");
        connection.on("CommentAdded", (data: any) => {
            console.log("CommentAdded received:", data);
            const { primary, codes } = resolveCodesFromPayload(data);
            if (!primary || !joinedPostsRef.current.has(primary)) return;
            const patch = applyPatchSafe(codes, data);
            applyPatchToQueryCache(codes, patch);
            schedulePostRefresh(primary);
            queryClient.invalidateQueries(['comments', primary]);
            onCommentAdded?.(data);
        });

        connection.off("CommentUpdated");
        connection.on("CommentUpdated", (data: any) => {
            console.log("CommentUpdated received:", data);
            const { primary, codes } = resolveCodesFromPayload(data);
            if (!primary || !joinedPostsRef.current.has(primary)) return;
            const patch = applyPatchSafe(codes, data);
            applyPatchToQueryCache(codes, patch);
            schedulePostRefresh(primary);
            queryClient.invalidateQueries(['comments', primary]);
            onCommentUpdated?.(data);
        });

        connection.off("CommentDeleted");
        connection.on("CommentDeleted", (data: any) => {
            log("CommentDeleted received:", data);
            const { primary, codes } = resolveCodesFromPayload(data);
            if (!primary || !joinedPostsRef.current.has(primary)) return;
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
            if (!primary || !joinedPostsRef.current.has(primary)) return;
            const patch = applyPatchSafe(codes, data);
            applyPatchToQueryCache(codes, patch);
            schedulePostRefresh(primary);
            queryClient.invalidateQueries(['feedDetail', primary]);
            onPostLiked?.(data);
        });

        connection.off("PostUnliked");
        connection.on("PostUnliked", (data: any) => {
            console.log("PostUnliked received:", data);
            const { primary, codes } = resolveCodesFromPayload(data);
            if (!primary || !joinedPostsRef.current.has(primary)) return;
            const patch = applyPatchSafe(codes, data);
            applyPatchToQueryCache(codes, patch);
            schedulePostRefresh(primary);
            queryClient.invalidateQueries(['feedDetail', primary]);
            onPostUnliked?.(data);
        });

        connection.off("CommentLiked");
        connection.on("CommentLiked", (data: any) => {
            log("CommentLiked received:", data);
            if (data?.userId === useAuthStore.getState().user?.id) return;
            const { primary, codes } = resolveCodesFromPayload(data);
            if (!primary || !joinedPostsRef.current.has(primary)) return;
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
            if (!primary || !joinedPostsRef.current.has(primary)) return;
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
            if (!primary || !joinedPostsRef.current.has(primary)) return;
            const patch = applyPatchSafe(codes, { ...data, postCode: primary });
            applyPatchToQueryCache(codes, patch);
            schedulePostRefresh(primary);
            queryClient.invalidateQueries(['feedDetail', primary]);
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
            for (const code of postsToRejoin) {
                await joinPostUpdates(code);
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
            // Only try to leave post updates if connection is still connected
            if (conn.state === signalR.HubConnectionState.Connected) {
                const joinedPosts = Array.from(joinedPostsRef.current);
                log(`Stopping khi xóa  thì LeavePostUpdates cho signal`, joinedPosts);
                
                // Use Promise.allSettled to avoid stopping on first failure
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
