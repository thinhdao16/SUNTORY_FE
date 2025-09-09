/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useCallback, useState } from "react";
import * as signalR from "@microsoft/signalr";
import ENV from "@/config/env";
import { useSocialChatStore } from "@/store/zustand/social-chat-store";
import { useAuthStore } from "@/store/zustand/auth-store";
import { useHistory } from "react-router";
import { useQueryClient } from "react-query";

export interface UseSocialSignalROptions {
    roomId: string;
    autoConnect?: boolean;
    enableDebugLogs?: boolean;
    refetchRoomData?: () => void;
    onTypingUsers?: (payload: any) => void;
}

const TTL_ON_MS = 5000;
const TTL_OFF_MS = 800;

// Heartbeat (ping) config
const PING_INTERVAL_MS = 20000;   // gửi định kỳ mỗi 20s
const PING_MIN_GAP_MS = 8000;     // khoảng cách tối thiểu giữa 2 lần ping (tránh spam)
const ACTIVITY_TOUCH_GAP_MS = 3000; // throttle khi có tương tác UI

export function useSocialSignalR(deviceId: string, options: UseSocialSignalROptions) {
    const { roomId, autoConnect = true, enableDebugLogs = false, refetchRoomData, onTypingUsers } = options;

    const history = useHistory();
    const queryClient = useQueryClient();
    const { isAuthenticated, user: userInfo } = useAuthStore();
    const { addMessage, updateMessageByCode, updateMessageAndRepliesByCode, deleteRoom, updateRoomChatInfo, updateMessagesReadStatusForActiveUsers } = useSocialChatStore();

    // refs chống stale
    const deviceIdRef = useRef(deviceId);
    const roomIdRef = useRef(roomId);
    const autoConnectRef = useRef(autoConnect);
    const debugRef = useRef(enableDebugLogs);
    const refetchRef = useRef(refetchRoomData);
    const onTypingUsersRef = useRef(onTypingUsers);
    const userIdRef = useRef<number | undefined>(userInfo?.id);
    useEffect(() => { deviceIdRef.current = deviceId; }, [deviceId]);
    useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
    useEffect(() => { autoConnectRef.current = autoConnect; }, [autoConnect]);
    useEffect(() => { debugRef.current = enableDebugLogs; }, [enableDebugLogs]);
    useEffect(() => { refetchRef.current = refetchRoomData; }, [refetchRoomData]);
    useEffect(() => { onTypingUsersRef.current = onTypingUsers; }, [onTypingUsers]);
    useEffect(() => { userIdRef.current = userInfo?.id; }, [userInfo?.id]);

    // signalR state
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const isConnectedRef = useRef(false);
    const currentRoomRef = useRef<string | null>(null);

    // typing state
    const typingOnRef = useRef(false);
    const typingIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const typingHardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastStatusRef = useRef<"on" | "off" | null>(null);
    const lastSentAtRef = useRef<number>(0);

    // activity (ping) state
    const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastPingAtRef = useRef<number>(0);
    const lastTouchAtRef = useRef<number>(0);

    const log = useCallback((message: string, ...args: any[]) => {
        if (debugRef.current) console.log(`[SocialSignalR] ${message}`, ...args);
    }, []);

    const createConnection = useCallback(() => {
        return new signalR.HubConnectionBuilder()
            .withUrl(`${ENV.BE}/chatHub?deviceId=${encodeURIComponent(deviceIdRef.current)}`, {
                accessTokenFactory: () => localStorage.getItem("token") || "",
            })
            .withAutomaticReconnect([0, 2000, 10000, 30000])
            .configureLogging(signalR.LogLevel.Warning)
            .build();
    }, []);

    // ---- helpers
    const invokeWithTimeout = <T,>(p: Promise<T>, ms = 3000) =>
        Promise.race([p, new Promise<never>((_, r) => setTimeout(() => r(new Error("timeout")), ms))]);

    // ---- typing
    const shouldSendStatus = (status: "on" | "off") => {
        const now = Date.now();
        const same = lastStatusRef.current === status;
        const within = now - lastSentAtRef.current;
        if (same) {
            if (status === "on" && within < TTL_ON_MS) return false;
            if (status === "off" && within < TTL_OFF_MS) return false;
        }
        lastStatusRef.current = status;
        lastSentAtRef.current = now;
        return true;
    };

    const sendTyping = async (status: "on" | "off") => {
        const conn = connectionRef.current;
        const ready = !!conn && conn.state === signalR.HubConnectionState.Connected;
        const targetRoomId = roomIdRef.current || currentRoomRef.current;
        if (!ready || !targetRoomId) return;
        if (!shouldSendStatus(status)) {
            if (debugRef.current) console.log("[Typing] skip duplicate:", status);
            return;
        }
        try {
            await invokeWithTimeout(conn.invoke("Typing", { roomId: targetRoomId, status }), 3000);
            if (debugRef.current) console.log(`[Typing] ${status} ✓`);
        } catch (e) {
            if (!(e as Error).message?.includes("timeout")) console.warn("[Typing] invoke failed:", e);
        }
    };

    const typingTouch = () => {
        if (!typingOnRef.current) {
            typingOnRef.current = true;
            void sendTyping("on");
        }
        if (typingIdleTimerRef.current) clearTimeout(typingIdleTimerRef.current);
        if (typingHardTimerRef.current) clearTimeout(typingHardTimerRef.current);
        typingIdleTimerRef.current = setTimeout(() => {
            typingOnRef.current = false;
            void sendTyping("off");
        }, 1500);
        typingHardTimerRef.current = setTimeout(() => {
            typingOnRef.current = false;
            void sendTyping("off");
        }, 20000);
    };

    const typingOff = async () => {
        if (typingIdleTimerRef.current) clearTimeout(typingIdleTimerRef.current);
        if (typingHardTimerRef.current) clearTimeout(typingHardTimerRef.current);
        if (!typingOnRef.current && lastStatusRef.current === "off") return;
        typingOnRef.current = false;
        try { await sendTyping("off"); } catch { }
    };

    const pingActiveRoom = useCallback(async (rid?: string): Promise<boolean> => {
        const conn = connectionRef.current;
        const room = rid ?? roomIdRef.current ?? currentRoomRef.current;
        if (!room) return false;
        if (!conn || conn.state !== signalR.HubConnectionState.Connected) return false;

        const now = Date.now();
        if (now - lastPingAtRef.current < PING_MIN_GAP_MS) {
            return true;
        }

        try {
            await invokeWithTimeout(conn.invoke("PingActiveRoom", room), 3000);
        } catch (e1) {
            try {
                await invokeWithTimeout(conn.invoke("PingActiveRoom", { roomId: room }), 3000);
            } catch (e2) {
                if (debugRef.current) console.warn("[Ping] failed", e1 ?? e2);
                return false;
            }
        }
        lastPingAtRef.current = now;
        if (debugRef.current) console.log("[Ping] ok ->", room);
        return true;
    }, []);

    const startPingLoop = useCallback((rid: string) => {
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);

        const tick = async () => {
            const now = Date.now();
            if (now - lastPingAtRef.current >= PING_INTERVAL_MS) {
                await pingActiveRoom(rid);
            }
        };

        void pingActiveRoom(rid);
        pingTimerRef.current = setInterval(tick, 2000); 
    }, [pingActiveRoom]);

    const stopPingLoop = useCallback(() => {
        if (pingTimerRef.current) {
            clearInterval(pingTimerRef.current);
            pingTimerRef.current = null;
        }
    }, []);

    const setInactiveInRoom = useCallback(async (chatRoomId?: string): Promise<boolean> => {
        const conn = connectionRef.current;
        const rid = chatRoomId ?? currentRoomRef.current;
        if (!rid) { log("setInactiveInRoom: missing roomId"); return false; }
        if (!conn || conn.state !== signalR.HubConnectionState.Connected) {
            log("setInactiveInRoom: connection not ready");
            return false;
        }
        try {
            await invokeWithTimeout(conn.invoke("SetInactiveInRoom", rid), 2000);
            return true;
        } catch (e1) {
            try {
                await invokeWithTimeout(conn.invoke("SetInactiveInRoom", { roomId: rid }), 2000);
                return true;
            } catch (e2) {
                try {
                    await invokeWithTimeout(conn.invoke("SetInactiveInRoom", { chatRoomId: rid }), 2000);
                    return true;
                } catch (e3) {
                    log("setInactiveInRoom failed", e1 ?? e2 ?? e3);
                    return false;
                }
            }
        }
    }, [log]);

    const activityTouch = useCallback(() => {
        const now = Date.now();
        if (now - lastTouchAtRef.current < ACTIVITY_TOUCH_GAP_MS) return; 
        lastTouchAtRef.current = now;
        void pingActiveRoom();
    }, [pingActiveRoom]);

    const activityOff = useCallback(async () => {
        await setInactiveInRoom();
    }, [setInactiveInRoom]);

    const joinUserNotify = async () => {
        const conn = connectionRef.current;
        if (!conn || conn.state !== signalR.HubConnectionState.Connected) return false;
        try {
            await conn.invoke("JoinUserNotify");
            log("Joined user notify ✓");
            return true;
        } catch (error) {
            log("Failed to join user notify:", String(error));
            return false;
        }
    };

    const joinChatRoom = async (chatRoomId: string) => {
        const conn = connectionRef.current;
        if (!conn || conn.state !== signalR.HubConnectionState.Connected) return false;
        try {
            await conn.invoke("JoinChatUserRoom", chatRoomId);
            currentRoomRef.current = chatRoomId;
            lastPingAtRef.current = 0;
            log(`Joined chat room: ${chatRoomId}`);
            startPingLoop(chatRoomId);
            return true;
        } catch (error) {
            log("Failed to join chat room:", String(error));
            return false;
        }
    };

    const leaveChatRoom = async (chatRoomId?: string) => {
        const conn = connectionRef.current;
        if (!conn || conn.state !== signalR.HubConnectionState.Connected) return false;
        const roomToLeave = chatRoomId || currentRoomRef.current;
        if (!roomToLeave) return false;

        try {
            stopPingLoop();
            try { await setInactiveInRoom(roomToLeave); } catch { }
            await conn.invoke("LeaveChatUserRoom", roomToLeave);
            if (roomToLeave === currentRoomRef.current) currentRoomRef.current = null;
            log(`Left chat room: ${roomToLeave}`);
            return true;
        } catch (error) {
            log("Failed to leave chat room:", String(error));
            return false;
        }
    };

    const sendMessage = async (chatRoomId: string, messageText: string, additionalData?: any) => {
        const conn = connectionRef.current;
        if (!conn || conn.state !== signalR.HubConnectionState.Connected) {
            throw new Error("SignalR connection is not ready");
        }
        const messageData = { chatCode: chatRoomId, messageText, deviceId: deviceIdRef.current, ...additionalData };
        await conn.invoke("SendUserMessage", messageData);
        log("Message sent:", messageData);
        lastPingAtRef.current = 0;
        void pingActiveRoom(chatRoomId);
        return true;
    };
    const [typingUsers, setTypingUsers] = useState<{ userId: number; userName: string; avatar?: string }[]>([]);
    const [activeUsers, setActiveUsers] = useState<{ userId: number; userName: string; avatar?: string; roomId?: string }[]>([]);
    const clearTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const setupEventHandlers = (connection: signalR.HubConnection) => {
        connection.off("TypingStatusChanged");
        connection.on("TypingStatusChanged", (message: any) => {
            if (!message) return;
            const { roomId: typingRoomId, typingUsers } = message;
            if (String(typingRoomId) !== String(roomIdRef.current)) return;
            if (!Array.isArray(typingUsers)) return;

            const filtered = typingUsers
                .filter((u: any) => (u?.userId ?? u?.id) !== userIdRef.current)
                .map((u: any) => ({
                    userId: u.userId ?? u.id,
                    userName: u.userName ?? u.name ?? `User ${u.userId ?? u.id}`,
                    avatar: u.avatar,
                }));

            if (filtered.length === 0) {
                if (clearTypingTimerRef.current) clearTimeout(clearTypingTimerRef.current);
                clearTypingTimerRef.current = setTimeout(() => setTypingUsers([]), 300);
            } else {
                if (clearTypingTimerRef.current) clearTimeout(clearTypingTimerRef.current);
                setTypingUsers(filtered);
            }
            onTypingUsersRef.current?.({ roomId: typingRoomId, typingUsers: filtered });
        });

        connection.off("ReceiveUserMessage");
        connection.on("ReceiveUserMessage", (message: any) => {
            addMessage(roomIdRef.current as string, message);
            setTypingUsers([]);
        });

        connection.off("UpdateUserMessage");
        connection.on("UpdateUserMessage", (message: any) => {
            updateMessageAndRepliesByCode(roomIdRef.current as string, message.code, message);
        });

        connection.off("RevokeUserMessage");
        connection.on("RevokeUserMessage", (message: any) => {
            updateMessageAndRepliesByCode(roomIdRef.current as string, message.code, message);
        });

        connection.off("FriendRequestEvent");
        connection.on("FriendRequestEvent", () => {
            refetchRef.current?.();
        });
        connection.off("ActiveUsersUpdated");
        connection.on("ActiveUsersUpdated", (message: any) => {
            if (!message) return;
            const { chatCode, activeUserIds, activeUserCount, lastUpdatedTime } = message;
            if (String(chatCode) === String(roomId)) {
                updateRoomChatInfo({
                    activeUserIds: activeUserIds || [],
                    activeUserCount: activeUserCount || 0,
                    lastActiveTime: lastUpdatedTime
                });
                
                setActiveUsers(activeUserIds || []);
                
                const currentUserId = useAuthStore.getState().user?.id;
                if (currentUserId && activeUserIds && activeUserIds.length > 0) {
                    updateMessagesReadStatusForActiveUsers(
                        roomIdRef.current as string, 
                        activeUserIds, 
                        currentUserId
                    );
                }
            }
        });

        connection.off("GroupChatRemoved");
        connection.on("GroupChatRemoved", (m: any) => {
            const removedCode =
                m?.chatCode || m?.chatInfo?.code || m?.roomId || m?.code || (typeof m === "string" ? m : null);
            if (!removedCode) return;
            try {
                deleteRoom(removedCode);
                try { history.replace("/social-chat"); }
                catch { window.location.href = "/social-chat"; }
                refetchRef.current?.();
            } catch (err) {
                console.error("Error handling GroupChatRemoved:", err);
            }
        });

        connection.onreconnecting(() => { isConnectedRef.current = false; });
        connection.onreconnected(async () => {
            isConnectedRef.current = true;
            if (currentRoomRef.current) await joinChatRoom(currentRoomRef.current);
            await joinUserNotify();
        });
        connection.onclose(() => {
            isConnectedRef.current = false;
            void typingOff();
            stopPingLoop();
        });
    };

    const startConnection = async () => {
        if (connectionRef.current) {
            try { await connectionRef.current.stop(); } catch { }
            connectionRef.current = null;
        }
        const connection = createConnection();
        connectionRef.current = connection;
        setupEventHandlers(connection);
        await connection.start();
        isConnectedRef.current = true;
        log("SignalR Connected, Connection ID:", connection.connectionId);
        await joinUserNotify();
        if (roomIdRef.current) await joinChatRoom(roomIdRef.current);
    };

    const stopConnection = async () => {
        if (!connectionRef.current) return;
        try {
            stopPingLoop();
            try { await setInactiveInRoom(); } catch { }
            await connectionRef.current.stop();
        } finally {
            connectionRef.current = null;
            isConnectedRef.current = false;
            currentRoomRef.current = null;
            await typingOff();
            log("Connection stopped");
        }
    };

    useEffect(() => {
        if (autoConnectRef.current && isAuthenticated) {
            startConnection().catch((error) => log("Auto connection failed:", String(error)));
        }
        return () => { void stopConnection(); };
    }, [isAuthenticated]);

    useEffect(() => {
        const next = roomIdRef.current;
        if (next && isConnectedRef.current && next !== currentRoomRef.current) {
            if (currentRoomRef.current) void leaveChatRoom(currentRoomRef.current);
            void joinChatRoom(next);
        }
    }, [roomId]);

    useEffect(() => () => { if (typingOnRef.current) void typingOff(); }, []);

    const typingReady =
        !!connectionRef.current &&
        isConnectedRef.current &&
        !!roomIdRef.current;

    return {
        // connection
        startConnection,
        stopConnection,
        getConnectionStatus: () => ({
            isConnected: isConnectedRef.current,
            connectionId: connectionRef.current?.connectionId,
            currentRoom: currentRoomRef.current,
            connectionState: connectionRef.current?.state,
        }),

        // rooms
        joinChatRoom,
        leaveChatRoom,
        joinUserNotify,

        // messages
        sendMessage,

        // activity
        pingActiveRoom,          // gọi thẳng nếu cần
        setInactiveInRoom,       // báo inactive khi rời/ẩn
        activity: {              // API dễ dùng từ UI
            touch: activityTouch,  // user vừa tương tác -> ping (throttle)
            off: activityOff,      // user rời/ẩn -> inactive
            ready: () => !!(connectionRef.current && isConnectedRef.current && (roomIdRef.current || currentRoomRef.current)),
        },

        // typing
        typingUsers,
        clearTypingUsers: () => setTypingUsers([]),
        typing: {
            touch: typingTouch,
            off: typingOff,
            setStatus: (s: "on" | "off") => sendTyping(s),
            ready: typingReady,
        },

        // expose states
        isConnected: isConnectedRef.current,
        currentRoom: currentRoomRef.current,
        connectionId: connectionRef.current?.connectionId,
    };
}
