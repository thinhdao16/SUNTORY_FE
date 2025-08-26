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
    refetchUserChatRooms: () => void;
}

export function useSocialSignalRListChatRoom(
    deviceId: string,
    options: UseSocialSignalRListChatRoomOptions
) {
    const { roomIds, autoConnect = true, enableDebugLogs = false, refetchUserChatRooms } = options;

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
        setNotificationCounts,
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
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();
    }, [deviceId]);

    const joinChatRooms = useCallback(async (chatRoomIds: string[]) => {
        const conn = connectionRef.current;
        if (!conn || conn.state !== signalR.HubConnectionState.Connected) return false;
        activeRoomsRef.current = chatRoomIds;
        for (const roomId of chatRoomIds) {
            if (joinedRoomsRef.current.has(roomId)) continue;
            try {
                await conn.invoke("JoinChatUserRoom", roomId);
                joinedRoomsRef.current.add(roomId);
                log(`Joined ${roomId}`);
            } catch (e) {
                log(`Join ${roomId} failed`, e);
            }
        }
        return true;
    }, [log]);

    const leaveChatRooms = useCallback(async (chatRoomIds: string[]) => {
        const conn = connectionRef.current;
        if (!conn || conn.state !== signalR.HubConnectionState.Connected) return false;
        for (const roomId of chatRoomIds) {
            if (!joinedRoomsRef.current.has(roomId)) continue;
            try {
                await conn.invoke("LeaveChatUserRoom", roomId);
                joinedRoomsRef.current.delete(roomId);
                log(`Left ${roomId}`);
            } catch (e) {
                log(`Leave ${roomId} failed`, e);
            }
        }
        return true;
    }, [log]);


    const joinUserNotify = useCallback(async () => {
        const conn = connectionRef.current;
        if (!conn || conn.state !== signalR.HubConnectionState.Connected) {
            console.log("❌ Connection not ready for JoinUserNotify");
            return false;
        }
        try {
            await conn.invoke("JoinUserNotify");
            return true;
        } catch (e) {
            console.error("JoinUserNotify failed", e);
            return false;
        }
    }, [log, user?.id]);


    const setupEventHandlers = useCallback((connection: signalR.HubConnection) => {
        // const originalOn = connection.on.bind(connection);
        // connection.on = function (methodName: string, newMethod: (...args: any[]) => void) {
        //     console.log(`📝 Registering event: ${methodName}`);
        //     return originalOn(methodName, (...args: any[]) => {
        //         console.log(`🎯 Event triggered: ${methodName}`, args);
        //         return newMethod(...args);
        //     });
        // };
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
            if (message.isNotifyRoomChat === false) return
            updateLastMessage(roomId, message);
        });

        connection.off("RevokeUserMessage");
        connection.on("RevokeUserMessage", (message: any) => {
            const roomId = message.chatInfo?.code || message.roomId;
            if (!roomId) return;
            updateChatRoomFromMessage(message);
            if (message.isNotifyRoomChat === false) return
            updateLastMessage(roomId, message);
        });

        connection.off("GroupChatCreated");
        connection.on("GroupChatCreated", (message: any) => {
            refetchUserChatRooms();
        });

        connection.off("UserVsUserChatCreated");
        connection.on("UserVsUserChatCreated", (message: any) => {
            console.log("UserVsUserChatCreated event received:", message);
            refetchUserChatRooms();
        });


        connection.off("RoomChatAndFriendRequestReceived");
        connection.on("RoomChatAndFriendRequestReceived", (message: any) => {
            console.log("Received RoomChatAndFriendRequestReceived:", message);
            if (message && typeof message === 'object') {
                const currentCounts = useSocialChatStore.getState().notificationCounts;
                const newCounts = {
                    userId: message.userId || 0,
                    unreadRoomsCount: message.unreadRoomsCount || 0,
                    pendingFriendRequestsCount: message.pendingFriendRequestsCount || 0,
                };
                if (
                    currentCounts.userId !== newCounts.userId ||
                    currentCounts.unreadRoomsCount !== newCounts.unreadRoomsCount ||
                    currentCounts.pendingFriendRequestsCount !== newCounts.pendingFriendRequestsCount
                ) {
                    setNotificationCounts(newCounts);
                    log("Updated notification counts from SignalR:", newCounts);
                } else {
                    log("Notification counts unchanged, skipping update");
                }
            }
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

            // setupEventHandlers(connection);

            await joinUserNotify();
            // if (activeRoomsRef.current.length) await joinChatRooms(activeRoomsRef.current);
            // try {

            //     await connection.invoke("GetRoomChatAndFriendRequestReceived");
            //     log("Re-invoked GetRoomChatAndFriendRequestReceived after reconnect");
            // } catch (error) {
            //     log("Failed to invoke GetRoomChatAndFriendRequestReceived on reconnect:", error);
            // }
        });
        connection.onclose((err) => {
            isConnectedRef.current = false;
            log("Closed:", err);
        });

    }, [updateLastMessage, updateChatRoomFromMessage, setRoomUnread, setNotificationCounts, user?.id, enableDebugLogs, log, joinChatRooms, joinUserNotify, refetchUserChatRooms]);

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

        // try {
        //     await conn.invoke("GetRoomChatAndFriendRequestReceived");
        //     console.log("Invoked GetRoomChatAndFriendRequestReceived");
        // } catch (error) {
        //     log("Failed to invoke GetRoomChatAndFriendRequestReceived:", error);
        // }

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
            lastUnreadRef.current = {};
            log("Stopped");
        }
    }, [log]);

    useEffect(() => {
        if (autoConnect && isAuthenticated) {
            startConnection().catch(e => log("Auto connect failed", e));
        }
        return () => { stopConnection(); };
    }, [autoConnect, isAuthenticated, startConnection, stopConnection, log]);

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
