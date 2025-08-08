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

    const { isAuthenticated } = useAuthStore();
    const { addMessage, updateMessage, updateMessageByCode, updateLastMessage, getLastMessageForRoom } = useSocialChatStore();

    const log = useCallback((message: string, ...args: any[]) => {
        if (enableDebugLogs) {
        }
    }, [enableDebugLogs]);

    const createConnection = useCallback(() => {
        const token = localStorage.getItem("token") || "";

        return new signalR.HubConnectionBuilder()
            .withUrl(`${ENV.BE}/chatHub?deviceId=${deviceId}`, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect([0, 2000, 10000, 30000])
            .configureLogging(signalR.LogLevel.Warning)
            .build();
    }, [deviceId]);

    const joinChatRooms = useCallback(async (chatRoomIds: string[]) => {
        if (!connectionRef.current || !isConnectedRef.current) {
            log("Cannot join rooms: connection not ready");
            return false;
        }

        activeRoomsRef.current = chatRoomIds;

        const results = [];
        for (const roomId of chatRoomIds) {
            try {
                await connectionRef.current.invoke("JoinChatUserRoom", roomId);
                joinedRoomsRef.current.add(roomId);
                log(`Joined chat room: ${roomId}`);
                results.push({ roomId, success: true });
            } catch (error) {
                log(`Failed to join chat room ${roomId}:`, error);
                results.push({ roomId, success: false, error });
            }
        }
        return results;
    }, [log]);

    const leaveChatRooms = useCallback(async (chatRoomIds: string[]) => {
        if (!connectionRef.current || !isConnectedRef.current) return false;

        const results = [];
        for (const roomId of chatRoomIds) {
            try {
                await connectionRef.current.invoke("LeaveChatUserRoom", roomId);
                joinedRoomsRef.current.delete(roomId);
                log(`Left chat room: ${roomId}`);
                results.push({ roomId, success: true });
            } catch (error) {
                log(`Failed to leave chat room ${roomId}:`, error);
                results.push({ roomId, success: false, error });
            }
        }
        return results;
    }, [log]);

    const joinUserNotify = useCallback(async () => {
        if (!connectionRef.current || !isConnectedRef.current) return false;

        try {
            await connectionRef.current.invoke("JoinUserNotify");
            log("Joined user notify room");
            return true;
        } catch (error) {
            log("Failed to join user notify:", error);
            return false;
        }
    }, [log]);

    const setupEventHandlers = useCallback((connection: signalR.HubConnection) => {
        connection.on("ReceiveUserMessage", (message: any) => {
            console.log("Received message:", message);
            if (message.chatInfo.code || message.roomId) {
                const roomId = message.chatInfo.code || message.roomId;
                addMessage(roomId, message);
                updateLastMessage(roomId, message);
            }
        });

        connection.on("UpdateUserMessage", (message: any) => {
            console.log("Updated message:", message);
            if (message.chatCode || message.roomId) {
                const roomId = message.chatCode || message.roomId;
                updateMessageByCode(roomId, message.code, message);

                // Also update last message if this is the latest one
                const currentLastMessage = getLastMessageForRoom(roomId);
                if (currentLastMessage && currentLastMessage.code === message.code) {
                    updateLastMessage(roomId, { ...currentLastMessage, ...message });
                }
            }
        });


        connection.onreconnecting((error) => {
            log("Reconnecting...", error);
            isConnectedRef.current = false;
        });

        connection.onreconnected(async (connectionId) => {
            log("Reconnected with ID:", connectionId);
            isConnectedRef.current = true;

            // Rejoin all active rooms
            if (activeRoomsRef.current && activeRoomsRef.current.length > 0) {
                await joinChatRooms(activeRoomsRef.current);
            }
            await joinUserNotify();
        });

        connection.onclose((error) => {
            log("Connection closed:", error);
            isConnectedRef.current = false;
        });
    }, [addMessage, updateMessage, updateMessageByCode, log, joinChatRooms, joinUserNotify]);

    // Send message
    const sendMessage = useCallback(async (
        chatRoomId: string,
        messageText: string,
        additionalData?: any
    ) => {
        if (!connectionRef.current || !isConnectedRef.current) {
            throw new Error("SignalR connection is not ready");
        }

        try {
            const messageData = {
                chatCode: chatRoomId,
                messageText,
                deviceId,
                ...additionalData
            };

            await connectionRef.current.invoke("SendUserMessage", messageData);
            log("Message sent:", messageData);
            return true;
        } catch (error) {
            log("Failed to send message:", error);
            throw error;
        }
    }, [deviceId, log]);

    // Start connection
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

            // Auto join user notify
            await joinUserNotify();

            // Auto join tất cả rooms nếu có
            if (roomIds && roomIds.length > 0) {
                await joinChatRooms(roomIds);
            }

            return true;
        } catch (error) {
            log("Failed to start connection:", error);
            isConnectedRef.current = false;
            throw error;
        }
    }, [createConnection, setupEventHandlers, joinUserNotify, joinChatRooms, roomIds, log]);

    // Stop connection
    const stopConnection = useCallback(async () => {
        if (connectionRef.current) {
            await connectionRef.current.stop();
            connectionRef.current = null;
            isConnectedRef.current = false;
            currentRoomRef.current = null;
            activeRoomsRef.current = [];
            joinedRoomsRef.current.clear();
            log("Connection stopped");
        }
    }, [log]);

    // Get connection status
    const getConnectionStatus = useCallback(() => ({
        isConnected: isConnectedRef.current,
        connectionId: connectionRef.current?.connectionId,
        currentRoom: currentRoomRef.current,
        activeRooms: activeRoomsRef.current,
        joinedRooms: Array.from(joinedRoomsRef.current),
        connectionState: connectionRef.current?.state
    }), []);

    // Effect để auto connect
    useEffect(() => {
        if (autoConnect && isAuthenticated) {
            startConnection().catch((error) => {
                log("Auto connection failed:", error);
            });
        }

        return () => {
            stopConnection();
        };
    }, [autoConnect, isAuthenticated, startConnection, stopConnection, log]);

    // Effect để sync rooms khi roomIds thay đổi
    useEffect(() => {
        if (isConnectedRef.current && roomIds) {
            const currentJoinedRooms = Array.from(joinedRoomsRef.current);
            const roomsToJoin = roomIds.filter(id => !joinedRoomsRef.current.has(id));
            const roomsToLeave = currentJoinedRooms.filter(id => !roomIds.includes(id));

            // Leave rooms không còn trong list
            if (roomsToLeave.length > 0) {
                leaveChatRooms(roomsToLeave);
            }

            // Join rooms mới
            if (roomsToJoin.length > 0) {
                joinChatRooms(roomsToJoin);
            }
        }
    }, [roomIds, joinChatRooms, leaveChatRooms]);

    return {
        startConnection,
        stopConnection,
        getConnectionStatus,
        joinChatRooms,
        leaveChatRooms,
        joinUserNotify,
        sendMessage,
        isConnected: isConnectedRef.current,
        joinedRooms: Array.from(joinedRoomsRef.current),
        activeRooms: activeRoomsRef.current,
        connectionId: connectionRef.current?.connectionId
    };
}