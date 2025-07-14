/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useCallback, useMemo } from 'react';
import * as signalR from "@microsoft/signalr";
import ENV from "@/config/env";
import { useSignalRStreamStore, StreamChunk, StreamEvent } from '@/store/zustand/signalr-stream-store';
import { logSignalRDiagnostics, getSignalRDiagnostics } from '@/utils/signalr-diagnostics';
import { runPreConnectionTests } from '@/utils/signalr-connection-test';
import { createMobileOptimizedConnection } from '@/utils/mobile-signalr-config';

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

    logStreamStats: () => void;

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
    const deviceIdRef = useRef(deviceId);

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
        getErrorStreams
    } = useSignalRStreamStore();

    const connectionFailures = useRef(0);
    const lastConnectionAttempt = useRef<Date | null>(null);

    useEffect(() => {
        deviceIdRef.current = deviceId;
    }, [deviceId]);

    const setupEventHandlers = useCallback((connection: signalR.HubConnection) => {
        connection.on("ReceiveStreamChunk", (data: {
            chatCode: string;
            messageCode: string;
            chunk: string;
            completeText: string;
        }) => {
            const chunk: StreamChunk = {
                chatCode: data.chatCode,
                messageCode: data.messageCode,
                chunk: data.chunk,
                completeText: data.completeText,
                timestamp: new Date().toISOString()
            };
            addStreamChunk(chunk);
        });

        connection.on("StreamComplete", (data: {
            ChatCode: string;
            MessageCode: string;
        }) => {
            const event: StreamEvent = {
                chatCode: data.ChatCode,
                messageCode: data.MessageCode,
                timestamp: new Date().toISOString()
            };
            completeStream(event);
        });

        connection.on("StreamError", (data: {
            ChatCode: string;
            MessageCode: string;
            ErrorMessage: string;
        }) => {
            const event: StreamEvent = {
                chatCode: data.ChatCode,
                messageCode: data.MessageCode,
                timestamp: new Date().toISOString(),
                errorMessage: data.ErrorMessage
            };


            errorStream(event);
        });

        connection.onreconnecting(() => {
            console.log("🔄 SignalR Stream reconnecting...");
            setConnection(false);
        });

        connection.onreconnected(async (connectionId?: string) => {
            try {
                await connection.invoke("JoinChatRoom", deviceIdRef.current);
                setConnection(true, connectionId || undefined);
            } catch (error) {
                console.error("❌ Failed to rejoin chat room:", error);
            }
        });

        connection.onclose((error?: Error) => {
            console.log("❌ SignalR Stream connection closed:", error);
            setConnection(false);
        });

    }, [addStreamChunk, completeStream, errorStream, setConnection]);

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

            if (!mountedRef.current || connectionAttemptRef.current?.signal.aborted) return;

            await connection.invoke("JoinChatRoom", deviceIdRef.current);

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
        if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) {
            throw new Error("SignalR connection is not available");
        }

        const messageCode = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            await connectionRef.current.invoke("SendStreamMessage", {
                deviceId: deviceIdRef.current,
                chatCode,
                messageCode,
                message,
                timestamp: new Date().toISOString(),
                ...additionalData
            });

            console.log("📤 Stream message sent:", { chatCode, messageCode, message });
            return messageCode;

        } catch (error) {
            console.error("❌ Failed to send stream message:", error);
            throw error;
        }
    }, []);

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

    const logStreamStats = useCallback(() => {
        const stats = streamStats;
        const activeStreams = getActiveStreams();
        const completedStreams = getCompletedStreams();
        const errorStreams = getErrorStreams();

        console.group("📊 Stream Statistics");
        console.log("Total streams:", stats.total);
        console.log("Active streams:", stats.active);
        console.log("Completed streams:", stats.completed);
        console.log("Error streams:", stats.errors);

        if (activeStreams.length > 0) {
            console.group("Active Streams Details:");
            activeStreams.forEach(stream => {
                console.log(`${stream.messageCode}:`, {
                    chatCode: stream.chatCode,
                    chunks: stream.chunks.length,
                    textLength: stream.completeText.length,
                    isStreaming: stream.isStreaming,
                    startTime: stream.startTime
                });
            });
            console.groupEnd();
        }

        if (completedStreams.length > 0) {
            console.group("Completed Streams Details:");
            completedStreams.forEach(stream => {
                console.log(`${stream.messageCode}:`, {
                    chatCode: stream.chatCode,
                    chunks: stream.chunks.length,
                    textLength: stream.completeText.length,
                    duration: stream.endTime ?
                        new Date(stream.endTime).getTime() - new Date(stream.startTime).getTime() + "ms" :
                        "unknown"
                });
            });
            console.groupEnd();
        }

        if (errorStreams.length > 0) {
            console.group("Error Streams Details:");
            errorStreams.forEach(stream => {
                console.error(`${stream.messageCode}:`, {
                    chatCode: stream.chatCode,
                    chunks: stream.chunks.length,
                    errorMessage: stream.errorMessage,
                    startTime: stream.startTime
                });
            });
            console.groupEnd();
        }

        console.groupEnd();
    }, [streamStats, getActiveStreams, getCompletedStreams, getErrorStreams]);

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
        logStreamStats,

        // Stats
        streamStats
    };
};
