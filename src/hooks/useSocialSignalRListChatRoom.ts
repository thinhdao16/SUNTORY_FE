/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import ENV from "@/config/env";
import { useSocialChatStore } from "@/store/zustand/social-chat-store";
import { useAuthStore } from "@/store/zustand/auth-store";

export interface UseSocialSignalRListChatRoomOptions {
    roomIds: string[];
    autoConnect?: boolean;
    enableDebugLogs?: boolean;
}

export function useSocialSignalRListChatRoom(
    deviceId: string,
    options: UseSocialSignalRListChatRoomOptions
) {
    const { roomIds, autoConnect = true, enableDebugLogs = false } = options;

    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const isConnectedRef = useRef(false);
    const joinedRoomsRef = useRef<Set<string>>(new Set());
    const activeRoomsRef = useRef<string[]>([]);
    const currentRoomRef = useRef<string | null>(null);

    const lastUnreadRef = useRef<Record<string, number>>({});

    const { isAuthenticated, user } = useAuthStore();
    const {
        updateLastMessage,
        updateChatRoomFromMessage,
        setRoomUnread,
    } = useSocialChatStore();

    const log = useCallback((message: string, ...args: any[]) => {
        if (enableDebugLogs) console.log(`[SignalR:List] ${message}`, ...args);
    }, [enableDebugLogs]);

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

    const joinChatRooms = useCallback(async (chatRoomIds: string[]) => {
        if (!connectionRef.current || !isConnectedRef.current) return false;
        activeRoomsRef.current = chatRoomIds;
        for (const roomId of chatRoomIds) {
            if (joinedRoomsRef.current.has(roomId)) continue;
            try {
                await connectionRef.current.invoke("JoinChatUserRoom", roomId);
                joinedRoomsRef.current.add(roomId);
                log(`Joined ${roomId}`);
            } catch (e) {
                log(`Join ${roomId} failed`, e);
            }
        }
        return true;
    }, [log]);

    const leaveChatRooms = useCallback(async (chatRoomIds: string[]) => {
        if (!connectionRef.current || !isConnectedRef.current) return false;
        for (const roomId of chatRoomIds) {
            if (!joinedRoomsRef.current.has(roomId)) continue;
            try {
                await connectionRef.current.invoke("LeaveChatUserRoom", roomId);
                joinedRoomsRef.current.delete(roomId);
                log(`Left ${roomId}`);
            } catch (e) {
                log(`Leave ${roomId} failed`, e);
            }
        }
        return true;
    }, [log]);

    const joinUserNotify = useCallback(async () => {
        if (!connectionRef.current || !isConnectedRef.current) return false;
        try {
            await connectionRef.current.invoke("JoinUserNotify");
            log("Joined user notify");
            return true;
        } catch (e) {
            log("JoinUserNotify failed", e);
            return false;
        }
    }, [log]);

    const setupEventHandlers = useCallback((connection: signalR.HubConnection) => {
        connection.off("ReceiveUserMessage");
        connection.on("ReceiveUserMessage", (message: any) => {
            const roomId = message.chatInfo?.code || message.roomId;
            if (!roomId) return;
            updateLastMessage(roomId, message);
            updateChatRoomFromMessage(message);
        });

        connection.off("UpdateUserMessage");
        connection.on("UpdateUserMessage", (message: any) => {
            const roomId = message.chatInfo?.code || message.roomId;
            if (!roomId) return;
            updateChatRoomFromMessage(message);
            if(message.isNotifyRoomChat === false) return
            updateLastMessage(roomId, message);
        });

        connection.off("RevokeUserMessage");
        connection.on("RevokeUserMessage", (message: any) => {
            console.log("RevokeUserMessageListRoom",message)
            const roomId = message.chatInfo?.code || message.roomId;
            if (!roomId) return;
            updateChatRoomFromMessage(message);
            if(message.isNotifyRoomChat === false) return
            updateLastMessage(roomId, message);
        });

        const handleUnread = (data: any) => {
            const chatCode = data?.chatCode;
            if (!chatCode) return;
            const myCount = data?.allUnreadCounts?.[String(user?.id)] ?? 0;

            const prev = lastUnreadRef.current[chatCode];
            if (prev === myCount) {
                return;
            }
            lastUnreadRef.current[chatCode] = myCount;
            setRoomUnread(chatCode, myCount);
            if (enableDebugLogs) log(`Unread ${chatCode}: ${prev} -> ${myCount}`);
        };

        connection.off("UnreadCountChanged");
        connection.off("unreadcountchanged");
        connection.on("UnreadCountChanged", handleUnread);
        connection.on("unreadcountchanged", handleUnread);

        connection.onreconnecting((err) => {
            isConnectedRef.current = false;
            log("Reconnecting...", err);
        });

        connection.onreconnected(async (id) => {
            isConnectedRef.current = true;
            log("Reconnected:", id);
            await joinUserNotify();
            if (activeRoomsRef.current.length) await joinChatRooms(activeRoomsRef.current);
        });

        connection.onclose((err) => {
            isConnectedRef.current = false;
            log("Closed:", err);
        });
    }, [updateLastMessage, updateChatRoomFromMessage, setRoomUnread, user?.id, enableDebugLogs, log, joinChatRooms, joinUserNotify]);

    const startConnection = useCallback(async () => {
        if (connectionRef.current) {
            try { await connectionRef.current.stop(); } catch { }
            connectionRef.current = null;
        }
        const conn = createConnection();
        connectionRef.current = conn;
        setupEventHandlers(conn);

        await conn.start();
        isConnectedRef.current = true;
        log("Connected:", conn.connectionId);

        await joinUserNotify();
        if (roomIds?.length) await joinChatRooms(roomIds);

        return true;
    }, [createConnection, setupEventHandlers, joinUserNotify, joinChatRooms, roomIds, log]);

    const stopConnection = useCallback(async () => {
        if (!connectionRef.current) return;
        try { await connectionRef.current.stop(); } finally {
            connectionRef.current = null;
            isConnectedRef.current = false;
            currentRoomRef.current = null;
            activeRoomsRef.current = [];
            joinedRoomsRef.current.clear();
            lastUnreadRef.current = {}; // reset cache
            log("Stopped");
        }
    }, [log]);

    useEffect(() => {
        if (autoConnect && isAuthenticated) {
            startConnection().catch(e => log("Auto connect failed", e));
        }
        return () => { stopConnection(); };
    }, [autoConnect, isAuthenticated, startConnection, stopConnection, log]);

    // Sync join/leave khi danh sách roomIds thay đổi
    useEffect(() => {
        if (!isConnectedRef.current) return;
        const current = Array.from(joinedRoomsRef.current);
        const toJoin = roomIds.filter(id => !joinedRoomsRef.current.has(id));
        const toLeave = current.filter(id => !roomIds.includes(id));
        if (toLeave.length) void leaveChatRooms(toLeave);
        if (toJoin.length) void joinChatRooms(toJoin);
    }, [roomIds, joinChatRooms, leaveChatRooms]);

    return {
        startConnection,
        stopConnection,
        isConnected: isConnectedRef.current,
        joinedRooms: Array.from(joinedRoomsRef.current),
        activeRooms: activeRoomsRef.current,
        connectionId: connectionRef.current?.connectionId
    };
}
