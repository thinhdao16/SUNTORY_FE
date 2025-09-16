/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import ENV from "@/config/env";
import { useAuthStore } from "@/store/zustand/auth-store";
import { useQueryClient } from 'react-query';
import { useSocialFeedStore } from '@/store/zustand/social-feed-store';

export interface UsePostSignalROptions {
    postId: string;
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
    const joinedPostRef = useRef(false);
    const activePostIdRef = useRef<string>("");

    const { isAuthenticated } = useAuthStore();
    const queryClient = useQueryClient();
    const { optimisticUpdatePostReaction } = useSocialFeedStore();

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
        if (joinedPostRef.current && activePostIdRef.current === postCode) return true;

        try {
            // Leave previous post if different
            if (joinedPostRef.current && activePostIdRef.current && activePostIdRef.current !== postCode) {
                await conn.invoke("LeavePostUpdates", activePostIdRef.current);
                log(`Left post updates for: ${activePostIdRef.current}`);
            }

            await conn.invoke("JoinPostUpdates", postCode);
            console.log("Joined post updates for:", postCode)
            joinedPostRef.current = true;
            activePostIdRef.current = postCode;
            log(`Joined post updates for: ${postCode}`);
            return true;
        } catch (e) {
            log("JoinPostUpdates failed", e);
            return false;
        }
    }, [log]);

    const leavePostUpdates = useCallback(async (postCode: string) => {
        const conn = connectionRef.current;
        if (!conn || conn.state !== signalR.HubConnectionState.Connected) return false;
        if (!joinedPostRef.current) return true;

        try {
            await conn.invoke("LeavePostUpdates", postCode);
            joinedPostRef.current = false;
            activePostIdRef.current = "";
            log(`Left post updates for: ${postCode}`);
            return true;
        } catch (e) {
            log("LeavePostUpdates failed", e);
            return false;
        }
    }, [log]);

    const attachHandlers = useCallback((connection: signalR.HubConnection) => {
        // Post Updated
        connection.off("PostUpdated");
        connection.on("PostUpdated", (data: any) => {
            log("PostUpdated received:", data);

            // Update post in cache if it matches current post
            if (data?.postCode === postId) {
                queryClient.invalidateQueries(['post', postId]);
            }

            onPostUpdated?.(data);
        });

        // Comment Added
        connection.off("CommentAdded");
        connection.on("CommentAdded", (data: any) => {
            log("CommentAdded received:", data);

            // Invalidate comments cache to fetch new comment
            if (data?.postCode === postId) {
                queryClient.invalidateQueries(['comments', postId]);
            }

            onCommentAdded?.(data);
        });

        // Comment Updated
        connection.off("CommentUpdated");
        connection.on("CommentUpdated", (data: any) => {
            log("CommentUpdated received:", data);

            // Invalidate comments cache to update comment
            if (data?.postCode === postId) {
                queryClient.invalidateQueries(['comments', postId]);
            }

            onCommentUpdated?.(data);
        });

        // Comment Deleted
        connection.off("CommentDeleted");
        connection.on("CommentDeleted", (data: any) => {
            log("CommentDeleted received:", data);

            // Invalidate comments cache to remove deleted comment
            if (data?.postCode === postId) {
                queryClient.invalidateQueries(['comments', postId]);
            }

            onCommentDeleted?.(data);
        });

        // Post Liked
        connection.off("PostLiked");
        connection.on("PostLiked", (data: any) => {
            console.log("PostLiked received:", data);

            // Update post reaction in store
            if (data?.postCode === postId) {
                // Don't update if it's from current user (already optimistically updated)
                if (data?.userId !== useAuthStore.getState().user?.id) {
                    queryClient.invalidateQueries(['post', postId]);
                }
            }

            onPostLiked?.(data);
        });

        // Post Unliked
        connection.off("PostUnliked");
        connection.on("PostUnliked", (data: any) => {
            log("PostUnliked received:", data);

            // Update post reaction in store
            if (data?.postCode === postId) {
                // Don't update if it's from current user (already optimistically updated)
                if (data?.userId !== useAuthStore.getState().user?.id) {
                    queryClient.invalidateQueries(['post', postId]);
                }
            }

            onPostUnliked?.(data);
        });

        // Comment Liked
        connection.off("CommentLiked");
        connection.on("CommentLiked", (data: any) => {
            log("CommentLiked received:", data);

            // Update comment reaction in cache
            if (data?.postCode === postId) {
                // Don't update if it's from current user (already optimistically updated)
                if (data?.userId !== useAuthStore.getState().user?.id) {
                    queryClient.invalidateQueries(['comments', postId]);
                }
            }

            onCommentLiked?.(data);
        });

        // Comment Unliked
        connection.off("CommentUnliked");
        connection.on("CommentUnliked", (data: any) => {
            log("CommentUnliked received:", data);

            // Update comment reaction in cache
            if (data?.postCode === postId) {
                // Don't update if it's from current user (already optimistically updated)
                if (data?.userId !== useAuthStore.getState().user?.id) {
                    queryClient.invalidateQueries(['comments', postId]);
                }
            }

            onCommentUnliked?.(data);
        });

        connection.onreconnecting((err) => {
            isConnectedRef.current = false;
            log("Reconnecting...", err);
        });

        connection.onreconnected(async (id) => {
            isConnectedRef.current = true;
            joinedPostRef.current = false;
            log("Reconnected:", id);
            if (activePostIdRef.current) {
                await joinPostUpdates(activePostIdRef.current);
            }
        });

        connection.onclose((err) => {
            isConnectedRef.current = false;
            joinedPostRef.current = false;
            activePostIdRef.current = "";
            log("Closed:", err);
        });
    }, [
        postId,
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
            if (activePostIdRef.current) {
                await leavePostUpdates(activePostIdRef.current);
            }
            await conn.stop();
        } finally {
            connectionRef.current = null;
            isConnectedRef.current = false;
            startedRef.current = false;
            joinedPostRef.current = false;
            activePostIdRef.current = "";
            log("Stopped");
        }
    }, [log, leavePostUpdates]);

    // Auto connect when authenticated
    useEffect(() => {
        if (autoConnect && isAuthenticated && postId && !startedRef.current) {
            void connect();
        }
        return () => { void stop(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoConnect, isAuthenticated, postId]);

    // Handle postId changes
    useEffect(() => {
        if (!isConnectedRef.current || !postId) return;

        if (activePostIdRef.current !== postId) {
            void joinPostUpdates(postId);
        }
    }, [postId, joinPostUpdates]);

    // Handle network reconnection
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
        joinedPost: joinedPostRef.current,
        activePostId: activePostIdRef.current,
        connectionId: connectionRef.current?.connectionId,
        joinPostUpdates,
        leavePostUpdates,
    };
}
