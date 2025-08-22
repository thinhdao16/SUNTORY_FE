/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useCallback, useMemo } from 'react';
import * as signalR from "@microsoft/signalr";
import ENV from "@/config/env";
import { useSignalRStreamStore, StreamChunk, StreamEvent } from '@/store/zustand/signalr-stream-store';
import { logSignalRDiagnostics, getSignalRDiagnostics } from '@/utils/signalr-diagnostics';
import { runPreConnectionTests } from '@/utils/signalr-connection-test';
import { createMobileOptimizedConnection } from '@/utils/mobile-signalr-config';
import { useChatStore } from '@/store/zustand/chat-store';
import { useParams } from 'react-router';

export interface UseSignalRStreamOptions {
    autoReconnect?: boolean;
    logLevel?: signalR.LogLevel;
    reconnectDelays?: number[];
}

export interface UseSignalRStreamReturn {
    isConnected: boolean;
    connectionId?: string;
    getStreamMessage: (messageCode: string) => any;
    getStreamMessagesByChatCode: (chatCode: string) => any[];
    getActiveStreams: () => any[];
    sendStreamMessage: (chatCode: string, message: string, additionalData?: any) => Promise<string>;
    clearStream: (messageCode: string) => void;
    clearChatStreams: (chatCode: string) => void;
    isStreamActive: (messageCode: string) => boolean;
    isStreamComplete: (messageCode: string) => boolean;
    hasStreamError: (messageCode: string) => boolean;
    getStreamError: (messageCode: string) => string | null;
    manualRetry: () => void;
    getConnectionStats: () => {
        failures: number;
        lastAttempt: Date | null;
        isRetrying: boolean;
    };
    streamStats: {
        total: number;
        active: number;
        completed: number;
        errors: number;
    };
}

export const useSignalRStream = (
    deviceId: string,
    options: UseSignalRStreamOptions = {}
): UseSignalRStreamReturn => {
    const {
        autoReconnect = true,
        logLevel = signalR.LogLevel.Warning,
    } = options;

    const connectionRef = useRef<signalR.HubConnection | null>(null);

    const {
        isConnected,
        connectionId,
        setConnection,
        addStreamChunk,
        completeStream,
        errorStream,
        clearStream,
        clearChatStreams,
        getStreamMessage,
        getStreamMessagesByChatCode,
        getActiveStreams,
        getCompletedStreams,
        getErrorStreams,
        // setCurrentChatStream,
        // clearCurrentChatStream,
    } = useSignalRStreamStore();
    const chatCode= useSignalRStreamStore.getState().chatCode;

    const setIsSending = useChatStore.getState().setIsSending;

    const connectionFailures = useRef(0);
    const lastConnectionAttempt = useRef<Date | null>(null);
    const { type, sessionId } = useParams<{ sessionId?: string; type?: string }>();
    const setupEventHandlers = useCallback((connection: signalR.HubConnection) => {
        connection.off("ReceiveStreamChunk");
        connection.off("StreamComplete");
        connection.off("StreamError");
        connection.on("ReceiveStreamChunk", (data: {
            botMessageCode: string;
            botMessageId: number;
            chatCode: string;
            chunk: string;
            completeText: string;
            userMessageCode: string;
            userMessageId: number;
        }) => {
            const chunk: StreamChunk = {
                id: data.botMessageId,
                chatCode: data.chatCode,
                messageCode: data.userMessageCode,
                chunk: data.chunk,
                completeText: data.completeText,
                userMessageId: data.userMessageId,
                code: data.botMessageCode,
                timestamp: new Date().toISOString()
            };
            if (data.chatCode === sessionId) {
                // setCurrentChatStream(chunk);
                console.log("first")
                addStreamChunk(chunk);
                setIsSending(true);

            }
        });

        connection.on("StreamComplete", (data: {
            botMessageCode: string;
            botMessageId: number;
            chatCode: string;
            chunk: string;
            completeText: string;
            userMessageCode: string;
            userMessageId: number;
        }) => {
            // console.log("Stream Complete:", data);
            const event: StreamEvent = {
                id: data.botMessageId,
                chatCode: data.chatCode,
                messageCode: data.userMessageCode,
                timestamp: new Date().toISOString(),
                code: data.botMessageCode
            };
            completeStream(event);
            // clearCurrentChatStream();
            setIsSending(false);
        });

        connection.on("StreamError", (data: {
            botMessageCode: string;
            botMessageId: number;
            chatCode: string;
            chunk: string;
            completeText: string;
            userMessageCode: string;
            userMessageId: number;
            errorMessage: string;
        }) => {
            // console.log("Stream Error:", data);
            const event: StreamEvent = {
                id: data.botMessageId,
                chatCode: data.chatCode,
                messageCode: data.userMessageCode,
                timestamp: new Date().toISOString(),
                errorMessage: data.errorMessage,
                code: data.botMessageCode
            };
            setIsSending(false);
            // clearCurrentChatStream();
            errorStream(event);
        });

        connection.onreconnecting(() => {
            console.log("🔄 SignalR Stream reconnecting...");
            setConnection(false);
            // setIsSending(false);
        });

        connection.onreconnected(async (connectionId?: string) => {
            try {
                await connection.invoke("JoinChatRoom", deviceId);
                setConnection(true, connectionId || undefined);
                setIsSending(false);

            } catch (error) {
                console.error("❌ Failed to rejoin chat room:", error);
                setIsSending(false);

            }
        });

        connection.onclose(async (error?: Error) => {
            console.warn("❌ SignalR connection closed:", error);
            setConnection(false);
            setIsSending(false);
            const reconnectDelay = 3000;

            setTimeout(async () => {
                try {
                    await connection.start();
                    console.log("✅ Reconnected SignalR successfully.");
                    setConnection(true);
                } catch (reconnectError) {
                    console.error("❌ Failed to reconnect:", reconnectError);
                }
            }, reconnectDelay);
        });


    }, [completeStream, errorStream, setConnection]);

    const mountedRef = useRef(true);
    const connectionAttemptRef = useRef<AbortController | null>(null);

    const connect = useCallback(async () => {
        if (connectionRef.current) {
            try {
                await connectionRef.current.stop();
            } catch (error) {
                console.warn("⚠️ Error stopping previous connection:", error);
            }
            connectionRef.current = null;
        }

        if (connectionAttemptRef.current) {
            connectionAttemptRef.current.abort();
        }

        connectionAttemptRef.current = new AbortController();

        try {
            await runPreConnectionTests(ENV.BE);

            logSignalRDiagnostics();

            const diagnostics = getSignalRDiagnostics();

            const connection = createMobileOptimizedConnection(
                ENV.BE + "/chatHub",
                () => localStorage.getItem("token") || ""
            );

            console.log(`🔧 Using ${diagnostics.suggestedTransport} transport for ${diagnostics.platform} platform`);

            connectionRef.current = connection;

            setupEventHandlers(connection);

            let retryCount = 0;
            const maxRetries = 3;

            while (retryCount < maxRetries) {
                try {
                    if (connectionAttemptRef.current?.signal.aborted) {
                        console.log("🛑 Connection attempt was aborted");
                        return;
                    }

                    await connection.start();
                    break;
                } catch (startError) {
                    retryCount++;
                    console.warn(`⚠️ SignalR connection attempt ${retryCount} failed:`, startError);

                    if (retryCount >= maxRetries) {
                        throw startError;
                    }

                    await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
                }
            }

            // if (!mountedRef.current || connectionAttemptRef.current?.signal.aborted) return;

            await connection.invoke("JoinChatRoom", deviceId);

            setConnection(true, connection.connectionId || undefined);
            connectionFailures.current = 0;


        } catch (error) {
            console.error("❌ SignalR Stream connection failed:", error);
            connectionFailures.current++;
            lastConnectionAttempt.current = new Date();

            if (mountedRef.current && !connectionAttemptRef.current?.signal.aborted) {
                setConnection(false);

                if (connectionFailures.current === 1) {
                    console.warn("⚠️ First connection attempt failed. This is common on mobile devices.");
                } else if (connectionFailures.current >= 3) {
                    console.error("🚨 Multiple connection failures detected. Consider switching to fallback mode.");
                }

                if (autoReconnect && connectionFailures.current < 5) {
                    const retryDelay = Math.min(5000 * connectionFailures.current, 30000);
                    console.log(`🔄 Auto-retrying SignalR connection in ${retryDelay}ms (attempt ${connectionFailures.current + 1})`);
                    setTimeout(() => {
                        if (mountedRef.current) {
                            connect();
                        }
                    }, retryDelay);
                } else if (connectionFailures.current >= 5) {
                    console.error("🛑 Maximum connection attempts reached. Manual retry required.");
                }
            }
        }
    }, [deviceId, autoReconnect, logLevel, setupEventHandlers, setConnection]);

    useEffect(() => {
        mountedRef.current = true;

        connect();
        return () => {
            mountedRef.current = false;
            if (connectionAttemptRef.current) {
                connectionAttemptRef.current.abort();
            }
            if (connectionRef.current) {
                connectionRef.current.stop();
                connectionRef.current = null;
            }
            setConnection(false);
        };
    }, [connect]);

    const sendStreamMessage = useCallback(async (
        chatCode: string,
        message: string,
        additionalData?: any
    ): Promise<string> => {
        // ✅ Better connection state validation
        if (!connectionRef.current) {
            console.error("❌ No SignalR connection available");
            throw new Error("SignalR connection is not available");
        }

        const connectionState = connectionRef.current.state;
        console.log("🔍 Connection state before send:", connectionState);

        if (connectionState !== signalR.HubConnectionState.Connected) {
            console.error("❌ SignalR not connected, current state:", connectionState);
            
            // ✅ Attempt to reconnect if disconnected
            if (connectionState === signalR.HubConnectionState.Disconnected) {
                console.log("🔄 Attempting to reconnect...");
                try {
                    await connect();
                    // Wait a bit for connection to stabilize
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) {
                        throw new Error("Failed to reconnect");
                    }
                } catch (reconnectError) {
                    console.error("❌ Reconnection failed:", reconnectError);
                    throw new Error("SignalR connection failed to reconnect");
                }
            } else {
                throw new Error(`SignalR connection is not ready (state: ${connectionState})`);
            }
        }

        const messageCode = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const payload = {
            deviceId: deviceId,
            chatCode,
            messageCode,
            message,
            timestamp: new Date().toISOString(),
            ...additionalData
        };

        try {
            console.log("📤 Sending stream message:", { chatCode, messageCode, payloadSize: JSON.stringify(payload).length });
            
            // ✅ Shorter timeout và better error handling
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`SendStreamMessage timeout after 30s for message: ${messageCode}`)), 30000)
            );

            const sendPromise = connectionRef.current.invoke("SendStreamMessage", payload);
            
            await Promise.race([sendPromise, timeoutPromise]);
            
            console.log("✅ Stream message sent successfully:", messageCode);
            return messageCode;

        } catch (error) {
            console.error("❌ Failed to send stream message:", error);
            
            // ✅ Check if connection is still valid after error
            if (connectionRef.current && connectionRef.current.state !== signalR.HubConnectionState.Connected) {
                console.warn("⚠️ Connection lost during send, attempting to reconnect...");
                setConnection(false);
                // Trigger reconnection
                setTimeout(() => connect(), 1000);
            }
            
            throw error;
        }
    }, [deviceId, connect, setConnection]);


    const isStreamActive = useCallback((messageCode: string) => {
        const stream = getStreamMessage(messageCode);
        return stream?.isStreaming || false;
    }, [getStreamMessage]);

    const isStreamComplete = useCallback((messageCode: string) => {
        const stream = getStreamMessage(messageCode);
        return stream?.isComplete || false;
    }, [getStreamMessage]);

    const hasStreamError = useCallback((messageCode: string) => {
        const stream = getStreamMessage(messageCode);
        return stream?.hasError || false;
    }, [getStreamMessage]);

    const getStreamError = useCallback((messageCode: string) => {
        const stream = getStreamMessage(messageCode);
        return stream?.errorMessage || null;
    }, [getStreamMessage]);

    const manualRetry = useCallback(() => {
        console.log("🔄 Manual retry requested");
        connectionFailures.current = 0;
        connect();
    }, []);

    const getConnectionStats = useCallback(() => ({
        failures: connectionFailures.current,
        lastAttempt: lastConnectionAttempt.current,
        isRetrying: connectionFailures.current > 0 && connectionFailures.current < 5
    }), []);

    const streamStats = useMemo(() => {
        const activeStreams = getActiveStreams();
        const completedStreams = getCompletedStreams();
        const errorStreams = getErrorStreams();

        return {
            total: activeStreams.length + completedStreams.length + errorStreams.length,
            active: activeStreams.length,
            completed: completedStreams.length,
            errors: errorStreams.length
        };
    }, [getActiveStreams, getCompletedStreams, getErrorStreams]);


    return {
        // Connection status
        isConnected,
        connectionId,

        // Stream data
        getStreamMessage,
        getStreamMessagesByChatCode,
        getActiveStreams,

        // Stream actions
        sendStreamMessage,
        clearStream,
        clearChatStreams,

        // Stream status helpers
        isStreamActive,
        isStreamComplete,
        hasStreamError,
        getStreamError,

        // Connection management
        manualRetry,
        getConnectionStats,

        // Debug helpers

        // Stats
        streamStats
    };
};
