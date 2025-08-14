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
}

export function useSocialSignalR(
    deviceId: string,
    options: UseSocialSignalROptions
) {
    const { roomId, autoConnect = true, enableDebugLogs = false, refetchRoomData } = options;

    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const isConnectedRef = useRef(false);
    const currentRoomRef = useRef<string | null>(null);

    const { isAuthenticated } = useAuthStore();
    const { addMessage, updateMessageByCode } = useSocialChatStore();

    const log = useCallback((message: string, ...args: any[]) => {
        if (enableDebugLogs) {
            console.log(`[SocialSignalR] ${message}`, ...args);
        }
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

    const setupEventHandlers = useCallback((connection: signalR.HubConnection) => {
        connection.off("ReceiveUserMessage");
        connection.on("ReceiveUserMessage", (message: any) => {
            addMessage(roomId, message);
        });

        connection.off("UpdateUserMessage");
        connection.on("UpdateUserMessage", (message: any) => {
            updateMessageByCode(roomId, message.code, message);
        });

        connection.off("RevokeUserMessage");
        connection.on("RevokeUserMessage", (message: any) => {
            updateMessageByCode(roomId, message.code, message);
        });

        connection.off("ReactUserMessage");
        connection.on("ReactUserMessage", (reaction: any) => {
        });

        connection.off("RoomChatUpdated");
        connection.on("RoomChatUpdated", (roomInfo: any) => {
        });

        connection.off("FriendRequestEvent");
        connection.on("FriendRequestEvent", (data: any) => {
            // console.log("FriendRequestEvent:", data);
            if (refetchRoomData) {
                refetchRoomData();
            }
        });

        connection.onreconnecting((error) => {
            isConnectedRef.current = false;
        });

        connection.onreconnected(async (connectionId) => {
            isConnectedRef.current = true;

            if (currentRoomRef.current) {
                await joinChatRoom(currentRoomRef.current);
            }
            await joinUserNotify();
        });

        connection.onclose((error) => {
            isConnectedRef.current = false;
        });
    }, [addMessage, updateMessageByCode, log, refetchRoomData, roomId]);

    const pingActiveRoom = useCallback(async (chatRoomId: string) => {
        console.log("Pinging active room:", chatRoomId);
        if (!connectionRef.current || !isConnectedRef.current) return false;
        try {
            await connectionRef.current.invoke("PingActiveRoom", chatRoomId);
            return true;
        } catch (error) {
            return false;
        }
    }, [log]);

    const setInactiveInRoom = useCallback(async (chatRoomId: string) => {
        console.log("unping")
        if (!connectionRef.current || !isConnectedRef.current) return false;
        try {
            await connectionRef.current.invoke("SetInactiveInRoom", chatRoomId);
            return true;
        } catch (error) {
            return false;
        }
    }, [log]);

    const joinChatRoom = useCallback(async (chatRoomId: string) => {
        if (!connectionRef.current || !isConnectedRef.current) return false;
        try {
            await connectionRef.current.invoke("JoinChatUserRoom", chatRoomId);
            currentRoomRef.current = chatRoomId;
            log(`Joined chat room: ${chatRoomId}`);

            try {
                await connectionRef.current.invoke("PingActiveRoom", chatRoomId);
                log(`Pinged active room: ${chatRoomId}`);
            } catch (e) {
                log("Ping right-after-join failed:", e);
            }

            return true;
        } catch (error) {
            log("Failed to join chat room:", error);
            return false;
        }
    }, [log]);


    const leaveChatRoom = useCallback(async (chatRoomId?: string) => {
        if (!connectionRef.current || !isConnectedRef.current) return false;

        const roomToLeave = chatRoomId || currentRoomRef.current;
        if (!roomToLeave) return false;

        try {
            await connectionRef.current.invoke("LeaveChatUserRoom", roomToLeave);
            if (roomToLeave === currentRoomRef.current) currentRoomRef.current = null;
            log(`Left chat room: ${roomToLeave}`);
            return true;
        } catch (error) {
            log("Failed to leave chat room:", error);
            return false;
        }
    }, [log]);

    const joinUserNotify = useCallback(async () => {
        if (!connectionRef.current || !isConnectedRef.current) return false;
        try {
            await connectionRef.current.invoke("JoinUserNotify");
            log("Joined user notify (no-arg) ✓");
            return true;
        } catch (error) {
            log("Failed to join user notify:", error);
            return false;
        }
    }, [log]);

    const sendMessage = useCallback(async (
        chatRoomId: string,
        messageText: string,
        additionalData?: any
    ) => {
        if (!connectionRef.current || !isConnectedRef.current) {
            throw new Error("SignalR connection is not ready");
        }
        try {
            const messageData = { chatCode: chatRoomId, messageText, deviceId, ...additionalData };
            await connectionRef.current.invoke("SendUserMessage", messageData);
            log("Message sent:", messageData);
            return true;
        } catch (error) {
            log("Failed to send message:", error);
            throw error;
        }
    }, [deviceId, log]);


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
                await connectionRef.current.stop();
            } finally {
                connectionRef.current = null;
                isConnectedRef.current = false;
                currentRoomRef.current = null;
                log("Connection stopped");
            }
        }
    }, [log]);

    const getConnectionStatus = useCallback(() => ({
        isConnected: isConnectedRef.current,
        connectionId: connectionRef.current?.connectionId,
        currentRoom: currentRoomRef.current,
        connectionState: connectionRef.current?.state,
    }), []);

    useEffect(() => {
        if (autoConnect && isAuthenticated) {
            startConnection().catch((error) => log("Auto connection failed:", error));
        }
        return () => { stopConnection(); };
    }, [autoConnect, isAuthenticated, startConnection, stopConnection, log]);

    useEffect(() => {
        if (roomId && isConnectedRef.current && roomId !== currentRoomRef.current) {
            if (currentRoomRef.current) void leaveChatRoom(currentRoomRef.current);
            void joinChatRoom(roomId);
        }
    }, [roomId, joinChatRoom, leaveChatRoom]);

    return {
        startConnection,
        stopConnection,
        getConnectionStatus,

        joinChatRoom,
        leaveChatRoom,
        joinUserNotify,   // <- public, nhưng no-arg
        sendMessage,

        pingActiveRoom,
        setInactiveInRoom,

        isConnected: isConnectedRef.current,
        currentRoom: currentRoomRef.current,
        connectionId: connectionRef.current?.connectionId,
    };
}
