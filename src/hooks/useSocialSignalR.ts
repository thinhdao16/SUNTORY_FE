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
}

export function useSocialSignalR(
    deviceId: string,
    options: UseSocialSignalROptions
) {
    const { roomId, autoConnect = true, enableDebugLogs = false } = options;

    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const isConnectedRef = useRef(false);
    const currentRoomRef = useRef<string | null>(null);

    const { isAuthenticated } = useAuthStore();
    const { addMessage, updateMessage, updateMessageByCode } = useSocialChatStore();
    const log = useCallback((message: string, ...args: any[]) => {
        if (enableDebugLogs) {
            console.log(`[SocialSignalR] ${message}`, ...args);
        }
    }, [enableDebugLogs]);

    // Tạo connection
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

    const setupEventHandlers = useCallback((connection: signalR.HubConnection) => {
        connection.on("ReceiveUserMessage", (message: any) => {
            console.log(message)
            addMessage(roomId, message);
        });

        connection.on("UpdateUserMessage", (message: any) => {
            // Sử dụng updateMessageByCode với messageCode
            updateMessageByCode(roomId, message.code, message);
        });

        connection.on("RevokeUserMessage", (message: any) => {
            console.log(message)

            updateMessageByCode(roomId, message.code, message);
        });

        connection.on("ReactUserMessage", (reaction: any) => {
            log("Message reaction:", reaction);
            // Có thể cập nhật reactions của message
        });

        connection.on("RoomChatUpdated", (roomInfo: any) => {
            log("Room chat updated:", roomInfo);
        });

        connection.onreconnecting((error) => {
            log("Reconnecting...", error);
            isConnectedRef.current = false;
        });

        connection.onreconnected(async (connectionId) => {
            log("Reconnected with ID:", connectionId);
            isConnectedRef.current = true;

            // Rejoin rooms
            if (currentRoomRef.current) {
                await joinChatRoom(currentRoomRef.current);
            }
            await joinUserNotify();
        });

        connection.onclose((error) => {
            log("Connection closed:", error);
            isConnectedRef.current = false;
        });
    }, [addMessage, updateMessage, log]);

    // Join chat room
    const joinChatRoom = useCallback(async (chatRoomId: string) => {
        if (!connectionRef.current || !isConnectedRef.current) {
            log("Cannot join room: connection not ready");
            return false;
        }

        try {
            await connectionRef.current.invoke("JoinChatUserRoom", chatRoomId);
            currentRoomRef.current = chatRoomId;
            log(`Joined chat room: ${chatRoomId}`);
            return true;
        } catch (error) {
            log("Failed to join chat room:", error);
            return false;
        }
    }, [log]);

    // Leave chat room
    const leaveChatRoom = useCallback(async (chatRoomId?: string) => {
        if (!connectionRef.current || !isConnectedRef.current) return false;

        const roomToLeave = chatRoomId || currentRoomRef.current;
        if (!roomToLeave) return false;

        try {
            await connectionRef.current.invoke("LeaveChatUserRoom", roomToLeave);
            if (roomToLeave === currentRoomRef.current) {
                currentRoomRef.current = null;
            }
            log(`Left chat room: ${roomToLeave}`);
            return true;
        } catch (error) {
            log("Failed to leave chat room:", error);
            return false;
        }
    }, [log]);

    // Join user notification
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

            // Auto join room if provided
            if (roomId) {
                await joinChatRoom(roomId);
            }

            return true;
        } catch (error) {
            log("Failed to start connection:", error);
            isConnectedRef.current = false;
            throw error;
        }
    }, [createConnection, setupEventHandlers, joinUserNotify, joinChatRoom, roomId, log]);

    // Stop connection
    const stopConnection = useCallback(async () => {
        if (connectionRef.current) {
            await connectionRef.current.stop();
            connectionRef.current = null;
            isConnectedRef.current = false;
            currentRoomRef.current = null;
            log("Connection stopped");
        }
    }, [log]);

    // Get connection status
    const getConnectionStatus = useCallback(() => ({
        isConnected: isConnectedRef.current,
        connectionId: connectionRef.current?.connectionId,
        currentRoom: currentRoomRef.current,
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
    }, [autoConnect, isAuthenticated, startConnection, stopConnection]);

    // Effect để switch room
    useEffect(() => {
        if (roomId && isConnectedRef.current && roomId !== currentRoomRef.current) {
            // Leave current room if any
            if (currentRoomRef.current) {
                leaveChatRoom(currentRoomRef.current);
            }
            // Join new room
            joinChatRoom(roomId);
        }
    }, [roomId, joinChatRoom, leaveChatRoom]);

    return {
        startConnection,
        stopConnection,
        getConnectionStatus,

        joinChatRoom,
        leaveChatRoom,
        joinUserNotify,
        sendMessage,

        isConnected: isConnectedRef.current,
        currentRoom: currentRoomRef.current,
        connectionId: connectionRef.current?.connectionId
    };
}