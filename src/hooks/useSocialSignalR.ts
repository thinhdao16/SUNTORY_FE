/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import ENV from "@/config/env";
import { useSocialChatStore } from "@/store/zustand/social-chat-store";
import { useAuthStore } from "@/store/zustand/auth-store";

export interface UseSocialSignalROptions {
    roomId: string;
    autoConnect?: boolean;
    enableDebugLogs?: boolean;
    refetchRoomData?: () => void;
    onTypingUsers?: (payload: any) => void;
}

export function useSocialSignalR(deviceId: string, options: UseSocialSignalROptions) {
    const {
        roomId,
        autoConnect = true,
        enableDebugLogs = false,
        refetchRoomData,
        onTypingUsers,
    } = options;

    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const isConnectedRef = useRef(false);
    const currentRoomRef = useRef<string | null>(null);

    const typingOnRef = useRef(false);
    const typingIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const typingHardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const { isAuthenticated } = useAuthStore();
    const { addMessage, updateMessageByCode , updateMessageAndRepliesByCode} = useSocialChatStore();

    const log = useCallback(
        (message: string, ...args: any[]) => {
            if (enableDebugLogs) console.log(`[SocialSignalR] ${message}`, ...args);
        },
        [enableDebugLogs]
    );

    const createConnection = useCallback(() => {
        const token = localStorage.getItem("token") || "";
        return new signalR.HubConnectionBuilder()
            .withUrl(`${ENV.BE}/chatHub?deviceId=${deviceId}`, {
                accessTokenFactory: () => token,
            })
            .withAutomaticReconnect([0, 2000, 10000, 30000])
            .configureLogging(signalR.LogLevel.Warning)
            .build();
    }, [deviceId]);

    const startPingLoop = useCallback(
        (rid: string) => {
            if (pingTimerRef.current) clearInterval(pingTimerRef.current);

            const fireOnce = async () => {
                const conn = connectionRef.current;
                if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;

                try {
                    await conn.invoke("PingActiveRoom", rid);
                    if (enableDebugLogs) console.log("[Ping] ok ->", rid);
                } catch (err1) {
                    try {
                        await conn.invoke("PingActiveRoom", { roomId: rid });
                        if (enableDebugLogs) console.log("[Ping:fallback] ok ->", rid);
                    } catch (err2) {
                        console.warn("[Ping] failed:", err1 || err2);
                    }
                }
            };

            void fireOnce();
            pingTimerRef.current = setInterval(() => {
                void fireOnce();
            }, 20000);
        },
        [enableDebugLogs]
    );

    const stopPingLoop = useCallback(() => {
        if (pingTimerRef.current) {
            clearInterval(pingTimerRef.current);
            pingTimerRef.current = null;
        }
    }, []);

    const setInactiveInRoom = useCallback(async (chatRoomId: string) => {
        const conn = connectionRef.current;
        if (!conn || conn.state !== signalR.HubConnectionState.Connected) return false;
        try {
            await conn.invoke("SetInactiveInRoom", chatRoomId);
            return true;
        } catch {
            return false;
        }
    }, []);

    const sendTyping = useCallback(
        async (status: "on" | "off") => {
            const conn = connectionRef.current;
            const ready =
                !!conn &&
                conn.state === signalR.HubConnectionState.Connected &&
                !!roomId;

            if (!ready) {
                log("Typing skipped", {
                    hasConn: !!conn,
                    state: conn?.state,
                    roomId,
                });
                return;
            }

            try {
                await conn.invoke("Typing", { roomId, status });

                log(`Typing ${status} -> ${roomId}`);
            } catch (e) {
                console.warn("Typing invoke failed:", e);
            }
        },
        [roomId, log]
    );

    const typingTouch = useCallback(() => {
        if (!typingOnRef.current) {
            typingOnRef.current = true;
            void sendTyping("on");
        }

        if (typingIdleTimerRef.current) clearTimeout(typingIdleTimerRef.current);
        typingIdleTimerRef.current = setTimeout(() => {
            typingOnRef.current = false;
            void sendTyping("off");
        }, 2000);

        if (typingHardTimerRef.current) clearTimeout(typingHardTimerRef.current);
        typingHardTimerRef.current = setTimeout(() => {
            typingOnRef.current = false;
            void sendTyping("off");
        }, 20000);
    }, [sendTyping]);

    const typingOff = useCallback(() => {
        if (typingIdleTimerRef.current) clearTimeout(typingIdleTimerRef.current);
        if (typingHardTimerRef.current) clearTimeout(typingHardTimerRef.current);
        if (typingOnRef.current) {
            typingOnRef.current = false;
            void sendTyping("off");
        }
    }, [sendTyping]);

    const joinUserNotify = useCallback(async () => {
        const conn = connectionRef.current;
        if (!conn || conn.state !== signalR.HubConnectionState.Connected) return false;
        try {
            await conn.invoke("JoinUserNotify");
            log("Joined user notify ✓");
            return true;
        } catch (error) {
            log("Failed to join user notify:", error);
            return false;
        }
    }, [log]);

    const joinChatRoom = useCallback(
        async (chatRoomId: string) => {
            const conn = connectionRef.current;
            if (!conn || conn.state !== signalR.HubConnectionState.Connected) return false;
            try {
                await conn.invoke("JoinChatUserRoom", chatRoomId);
                currentRoomRef.current = chatRoomId;
                log(`Joined chat room: ${chatRoomId}`);
                startPingLoop(chatRoomId);
                return true;
            } catch (error) {
                log("Failed to join chat room:", error);
                return false;
            }
        },
        [log, startPingLoop]
    );

    const leaveChatRoom = useCallback(
        async (chatRoomId?: string) => {
            const conn = connectionRef.current;
            if (!conn || conn.state !== signalR.HubConnectionState.Connected) return false;

            const roomToLeave = chatRoomId || currentRoomRef.current;
            if (!roomToLeave) return false;

            try {
                stopPingLoop();
                try {
                    await conn.invoke("SetInactiveInRoom", roomToLeave);
                } catch { }
                await conn.invoke("LeaveChatUserRoom", roomToLeave);
                if (roomToLeave === currentRoomRef.current) currentRoomRef.current = null;
                log(`Left chat room: ${roomToLeave}`);
                return true;
            } catch (error) {
                log("Failed to leave chat room:", error);
                return false;
            }
        },
        [log, stopPingLoop]
    );

    const sendMessage = useCallback(
        async (chatRoomId: string, messageText: string, additionalData?: any) => {
            const conn = connectionRef.current;
            if (!conn || conn.state !== signalR.HubConnectionState.Connected) {
                throw new Error("SignalR connection is not ready");
            }
            try {
                const messageData = { chatCode: chatRoomId, messageText, deviceId, ...additionalData };
                await conn.invoke("SendUserMessage", messageData);
                log("Message sent:", messageData);
                return true;
            } catch (error) {
                log("Failed to send message:", error);
                throw error;
            }
        },
        [deviceId, log]
    );

    const setupEventHandlers = useCallback((connection: signalR.HubConnection) => {
        connection.off("TypingStatusChanged");
        connection.on("TypingStatusChanged", (payload: any) => {
            console.log("first")
        });

        const onEvt = (name: string, handler: (p: any) => void) => {
            const lower = name.toLowerCase();
            connection.off(name);
            connection.on(name, handler);
            if (lower !== name) {
                connection.off(lower);
                connection.on(lower, handler);
            }
        };

        connection.off("ReceiveUserMessage");
        connection.on("ReceiveUserMessage", (message: any) => {
            addMessage(roomId, message);
        });

        connection.off("UpdateUserMessage");
        connection.on("UpdateUserMessage", (message: any) => {
            // updateMessageByCode(roomId, message.code, message);
            updateMessageAndRepliesByCode(roomId, message.code, message);
            
        });

        connection.off("RevokeUserMessage");
        connection.on("RevokeUserMessage", (message: any) => {
            // updateMessageByCode(roomId, message.code, message);
            updateMessageAndRepliesByCode(roomId, message.code, message);
        });

        connection.off("FriendRequestEvent");
        connection.on("FriendRequestEvent", (data: any) => {
            if (refetchRoomData) refetchRoomData();
        });

        onEvt("UnreadCountChanged", (payload: any) => {
        });

        onEvt("TypingStatusChanged", (payload: any) => {
            onTypingUsers?.(payload);
        });


        connection.onreconnecting(() => { isConnectedRef.current = false; });
        connection.onreconnected(async () => {
            isConnectedRef.current = true;
            if (currentRoomRef.current) await joinChatRoom(currentRoomRef.current);
            await joinUserNotify();
        });
        connection.onclose(() => {
            isConnectedRef.current = false;
            typingOff();
        });
    }, [
        addMessage,
        updateMessageByCode,
        refetchRoomData,
        onTypingUsers,
        joinChatRoom,
        joinUserNotify,
        typingOff,
        roomId,
    ]);


    const startConnection = useCallback(async () => {
        if (connectionRef.current) {
            await connectionRef.current.stop();
            connectionRef.current = null;
        }
        const connection = createConnection();
        connectionRef.current = connection;

        setupEventHandlers(connection);

        try {
            await connection.start();
            isConnectedRef.current = true;
            log("SignalR Connected, Connection ID:", connection.connectionId);

            await joinUserNotify();
            if (roomId) await joinChatRoom(roomId);

            return true;
        } catch (error) {
            log("Failed to start connection:", error);
            isConnectedRef.current = false;
            throw error;
        }
    }, [createConnection, setupEventHandlers, joinUserNotify, joinChatRoom, roomId, log]);

    const stopConnection = useCallback(async () => {
        if (connectionRef.current) {
            try {
                stopPingLoop();
                await connectionRef.current.stop();
            } finally {
                connectionRef.current = null;
                isConnectedRef.current = false;
                currentRoomRef.current = null;
                typingOff();
                log("Connection stopped");
            }
        }
    }, [log, stopPingLoop, typingOff]);

    const getConnectionStatus = useCallback(
        () => ({
            isConnected: isConnectedRef.current,
            connectionId: connectionRef.current?.connectionId,
            currentRoom: currentRoomRef.current,
            connectionState: connectionRef.current?.state,
        }),
        []
    );

    useEffect(() => {
        if (autoConnect && isAuthenticated) {
            startConnection().catch((error) => log("Auto connection failed:", error));
        }
        return () => {
            stopConnection();
        };
    }, [autoConnect, isAuthenticated, startConnection, stopConnection, log]);

    useEffect(() => {
        if (roomId && isConnectedRef.current && roomId !== currentRoomRef.current) {
            if (currentRoomRef.current) void leaveChatRoom(currentRoomRef.current);
            void joinChatRoom(roomId);
        }
    }, [roomId, joinChatRoom, leaveChatRoom]);

    useEffect(() => {
        return () => {
            if (typingOnRef.current) typingOff();
        };
    }, [typingOff]);

    const typingReady =
        !!connectionRef.current &&
        isConnectedRef.current &&
        !!roomId;

    return {
        startConnection,
        stopConnection,
        getConnectionStatus,

        joinChatRoom,
        leaveChatRoom,
        joinUserNotify,
        sendMessage,

        pingActiveRoom: (rid: string) => {
            const conn = connectionRef.current;
            if (!conn || conn.state !== signalR.HubConnectionState.Connected) return Promise.resolve(false);
            return conn.invoke("PingActiveRoom", rid).then(() => true).catch(() => false);
        },
        setInactiveInRoom,

        typing: {
            touch: typingTouch,
            off: typingOff,
            setStatus: (s: "on" | "off") => sendTyping(s),
            ready: typingReady,
        },

        isConnected: isConnectedRef.current,
        currentRoom: currentRoomRef.current,
        connectionId: connectionRef.current?.connectionId,
    };
}
