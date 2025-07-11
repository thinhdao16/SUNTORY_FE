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
    // Connection status
    isConnected: boolean;
    connectionId?: string;

    // Stream data
    getStreamMessage: (messageCode: string) => any;
    getStreamMessagesByChatCode: (chatCode: string) => any[];
    getActiveStreams: () => any[];

    // Stream actions
    sendStreamMessage: (chatCode: string, message: string, additionalData?: any) => Promise<string>;
    clearStream: (messageCode: string) => void;
    clearChatStreams: (chatCode: string) => void;

    // Stream status helpers
    isStreamActive: (messageCode: string) => boolean;
    isStreamComplete: (messageCode: string) => boolean;
    hasStreamError: (messageCode: string) => boolean;
    getStreamError: (messageCode: string) => string | null;

    // Connection management
    manualRetry: () => void;
    getConnectionStats: () => {
        failures: number;
        lastAttempt: Date | null;
        isRetrying: boolean;
    };

    // Debug helpers
    logStreamStats: () => void;

    // Stats
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
        reconnectDelays = [0, 2000, 10000, 30000]
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

    // Connection failure tracking
    const connectionFailures = useRef(0);
    const lastConnectionAttempt = useRef<Date | null>(null);

    // Update deviceId ref when it changes
    useEffect(() => {
        deviceIdRef.current = deviceId;
    }, [deviceId]);

    // Setup SignalR event handlers
    const setupEventHandlers = useCallback((connection: signalR.HubConnection) => {
        // Handle stream chunks
        connection.on("ReceiveStreamChunk", (data: {
            ChatCode: string;
            MessageCode: string;
            Chunk: string;
            CompleteText: string;
        }) => {
            const chunk: StreamChunk = {
                chatCode: data.ChatCode,
                messageCode: data.MessageCode,
                chunk: data.Chunk,
                completeText: data.CompleteText,
                timestamp: new Date().toISOString()
            };

            console.group("📩 Stream chunk received");
            console.log("Chat Code:", chunk.chatCode);
            console.log("Message Code:", chunk.messageCode);
            console.log("Chunk length:", chunk.chunk.length);
            console.log("Chunk content:", chunk.chunk.substring(0, 100) + (chunk.chunk.length > 100 ? "..." : ""));
            console.log("Complete text length:", chunk.completeText.length);
            console.log("Complete text preview:", chunk.completeText.substring(0, 200) + (chunk.completeText.length > 200 ? "..." : ""));
            console.log("Timestamp:", chunk.timestamp);
            console.groupEnd();

            addStreamChunk(chunk);
        });

        // Handle stream completion
        connection.on("StreamComplete", (data: {
            ChatCode: string;
            MessageCode: string;
        }) => {
            const event: StreamEvent = {
                chatCode: data.ChatCode,
                messageCode: data.MessageCode,
                timestamp: new Date().toISOString()
            };

            console.group("✅ Stream completed");
            console.log("Chat Code:", event.chatCode);
            console.log("Message Code:", event.messageCode);
            console.log("Timestamp:", event.timestamp);

            // Get final stream data for logging
            const streamMessage = getStreamMessage(event.messageCode);
            if (streamMessage) {
                console.log("Total chunks received:", streamMessage.chunks.length);
                console.log("Final complete text length:", streamMessage.completeText.length);
                console.log("Stream duration:",
                    new Date(event.timestamp).getTime() - new Date(streamMessage.startTime).getTime() + "ms");
            }
            console.groupEnd();

            completeStream(event);
        });

        // Handle stream errors
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

            console.group("❌ Stream error");
            console.error("Chat Code:", event.chatCode);
            console.error("Message Code:", event.messageCode);
            console.error("Error Message:", event.errorMessage);
            console.error("Timestamp:", event.timestamp);

            // Get stream data for context
            const streamMessage = getStreamMessage(event.messageCode);
            if (streamMessage) {
                console.error("Chunks received before error:", streamMessage.chunks.length);
                console.error("Partial text length:", streamMessage.completeText.length);
            }
            console.groupEnd();

            errorStream(event);
        });

        // Handle connection state changes
        connection.onreconnecting(() => {
            console.log("🔄 SignalR Stream reconnecting...");
            setConnection(false);
        });

        connection.onreconnected(async (connectionId?: string) => {
            console.log("✅ SignalR Stream reconnected:", connectionId);
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

    // Connection state refs
    const mountedRef = useRef(true);
    const connectionAttemptRef = useRef<AbortController | null>(null);

    // Connection function
    const connect = useCallback(async () => {
        // Cleanup existing connection
        if (connectionRef.current) {
            try {
                await connectionRef.current.stop();
            } catch (error) {
                console.warn("⚠️ Error stopping previous connection:", error);
            }
            connectionRef.current = null;
        }

        // Cancel previous connection attempt
        if (connectionAttemptRef.current) {
            connectionAttemptRef.current.abort();
        }

        connectionAttemptRef.current = new AbortController();

        try {
            // Run pre-connection tests
            await runPreConnectionTests(ENV.BE);

            // Log diagnostics for troubleshooting
            logSignalRDiagnostics();

            const diagnostics = getSignalRDiagnostics();

            // Create mobile-optimized connection
            const connection = createMobileOptimizedConnection(
                ENV.BE + "/chatHub",
                () => localStorage.getItem("token") || ""
            );

            console.log(`🔧 Using ${diagnostics.suggestedTransport} transport for ${diagnostics.platform} platform`);

            connectionRef.current = connection;

            // Register event handlers
            setupEventHandlers(connection);

            // Start connection with retry logic
            let retryCount = 0;
            const maxRetries = 3;

            while (retryCount < maxRetries) {
                try {
                    if (connectionAttemptRef.current?.signal.aborted) {
                        console.log("🛑 Connection attempt was aborted");
                        return;
                    }

                    await connection.start();
                    break; // Success, exit retry loop
                } catch (startError) {
                    retryCount++;
                    console.warn(`⚠️ SignalR connection attempt ${retryCount} failed:`, startError);

                    if (retryCount >= maxRetries) {
                        throw startError; // Re-throw if all retries failed
                    }

                    // Wait before retry (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
                }
            }

            if (!mountedRef.current || connectionAttemptRef.current?.signal.aborted) return;

            // Join chat room
            await connection.invoke("JoinChatRoom", deviceIdRef.current);

            // Update connection status
            setConnection(true, connection.connectionId || undefined);
            connectionFailures.current = 0; // Reset failure count on successful connection

            console.log("✅ SignalR Stream connected:", connection.connectionId);

        } catch (error) {
            console.error("❌ SignalR Stream connection failed:", error);
            connectionFailures.current++;
            lastConnectionAttempt.current = new Date();

            if (mountedRef.current && !connectionAttemptRef.current?.signal.aborted) {
                setConnection(false);

                // Show user-friendly error message based on failure count
                if (connectionFailures.current === 1) {
                    console.warn("⚠️ First connection attempt failed. This is common on mobile devices.");
                } else if (connectionFailures.current >= 3) {
                    console.error("🚨 Multiple connection failures detected. Consider switching to fallback mode.");
                    console.group("🔧 Troubleshooting Tips");
                    console.log("1. Check your internet connection");
                    console.log("2. Verify the server is running and accessible");
                    console.log("3. Check authentication token validity");
                    console.log("4. Review CORS configuration on server");
                    console.log("5. For mobile: ensure allowNavigation includes server domain");
                    console.groupEnd();
                }

                // Auto-retry after delay if auto-reconnect is enabled
                if (autoReconnect && connectionFailures.current < 5) {
                    const retryDelay = Math.min(5000 * connectionFailures.current, 30000); // Cap at 30 seconds
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

    // Initialize SignalR connection
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

    // Send stream message
    const sendStreamMessage = useCallback(async (
        chatCode: string,
        message: string,
        additionalData?: any
    ): Promise<string> => {
        if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) {
            throw new Error("SignalR connection is not available");
        }

        // Generate unique message code
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

    // Stream status helpers
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

    // Manual retry function
    const manualRetry = useCallback(() => {
        console.log("🔄 Manual retry requested");
        connectionFailures.current = 0; // Reset failure count
        connect();
    }, []);

    // Get connection statistics
    const getConnectionStats = useCallback(() => ({
        failures: connectionFailures.current,
        lastAttempt: lastConnectionAttempt.current,
        isRetrying: connectionFailures.current > 0 && connectionFailures.current < 5
    }), []);

    // Stream statistics
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

    // Debug function to log stream statistics
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
