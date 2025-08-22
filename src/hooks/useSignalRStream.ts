/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useCallback, useMemo } from 'react';
import * as signalR from "@microsoft/signalr";
import ENV from "@/config/env";
import { useSignalRStreamStore, StreamChunk, StreamEvent } from '@/store/zustand/signalr-stream-store';
import { logSignalRDiagnostics, getSignalRDiagnostics } from '@/utils/signalr-diagnostics';
import { createMobileOptimizedConnection, createConnectionWithFallback } from '@/utils/mobile-signalr-config';
import { useChatStore } from '@/store/zustand/chat-store';
import { useParams } from 'react-router';
import { streamMonitor } from '../utils/stream-monitor';

export interface UseSignalRStreamOptions {
    autoReconnect?: boolean;
    logLevel?: signalR.LogLevel;
    reconnectDelays?: number[];
    sendTimeout?: number; // Thêm tùy chọn timeout có thể config
    maxRetries?: number; // Thêm tùy chọn max retries
    enableMonitoring?: boolean; // Thêm option để enable/disable monitoring
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
        connectionState: string;
        isHealthy: boolean;
    };
    streamStats: {
        total: number;
        active: number;
        completed: number;
        errors: number;
        successRate: number;
        avgChunksPerStream: number;
    };
    // Optional monitoring utilities (only when enableMonitoring = true)
    getPerformanceReport?: () => any;
    exportLogs?: () => string;
    clearOldMetrics?: (ms?: number) => void;
    streamMonitor?: any;
}

export const useSignalRStream = (
    deviceId: string,
    options: UseSignalRStreamOptions = {}
): UseSignalRStreamReturn => {
    const {
        autoReconnect = true,
        logLevel = signalR.LogLevel.Warning,
        sendTimeout = 10000, // Giảm timeout từ 30s xuống 10s để UX tốt hơn
        maxRetries = 3,
        enableMonitoring = true, // Enable monitoring by default
    } = options;

    const connectionRef = useRef<signalR.HubConnection | null>(null);
    // Thêm debouncing cho reconnection
    const reconnectTimeoutRef = useRef<number | null>(null);
    const lastReconnectAttempt = useRef<number>(0);
    
    // Thêm batching cho stream chunks
    const chunkBuffer = useRef<StreamChunk[]>([]);
    const batchTimeoutRef = useRef<number | null>(null);

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

    // Thêm function để process batch chunks
    const processBatchedChunks = useCallback(() => {
        if (chunkBuffer.current.length > 0) {
            chunkBuffer.current.forEach(chunk => {
                addStreamChunk(chunk);
            });
            chunkBuffer.current = [];
        }
    }, [addStreamChunk]);

    // Debounced reconnection
    const debouncedReconnect = useCallback((delay: number = 1000) => {
        const now = Date.now();
        if (now - lastReconnectAttempt.current < 1000) {
            // Prevent too frequent reconnection attempts
            return;
        }
        
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(async () => {
            lastReconnectAttempt.current = Date.now();
            try {
                await connect();
            } catch (error) {
                console.error("❌ Debounced reconnection failed:", error);
            }
        }, delay);
    }, []);

    const setupEventHandlers = useCallback((connection: signalR.HubConnection) => {
        // Đảm bảo remove all existing handlers trước khi add mới
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
                // Track chunk in monitor
                if (enableMonitoring) {
                    streamMonitor.addChunk(data.userMessageCode, data.chunk);
                }
                
                // Sử dụng batching để cải thiện performance
                chunkBuffer.current.push(chunk);
                
                if (batchTimeoutRef.current) {
                    clearTimeout(batchTimeoutRef.current);
                }
                
                // Process batch sau 16ms (tương đương 60fps)
                batchTimeoutRef.current = setTimeout(() => {
                    processBatchedChunks();
                    setIsSending(true);
                }, 16);
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
            // Process any remaining batched chunks before completing
            if (batchTimeoutRef.current) {
                clearTimeout(batchTimeoutRef.current);
                processBatchedChunks();
            }
            
            // Track completion in monitor
            if (enableMonitoring) {
                streamMonitor.completeStream(data.userMessageCode);
            }
            
            const event: StreamEvent = {
                id: data.botMessageId,
                chatCode: data.chatCode,
                messageCode: data.userMessageCode,
                timestamp: new Date().toISOString(),
                code: data.botMessageCode
            };
            completeStream(event);
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
            // Clear any pending batched chunks on error
            if (batchTimeoutRef.current) {
                clearTimeout(batchTimeoutRef.current);
                chunkBuffer.current = [];
            }
            
            // Track error in monitor
            if (enableMonitoring) {
                streamMonitor.errorStream(data.userMessageCode, data.errorMessage);
            }
            
            const event: StreamEvent = {
                id: data.botMessageId,
                chatCode: data.chatCode,
                messageCode: data.userMessageCode,
                timestamp: new Date().toISOString(),
                errorMessage: data.errorMessage,
                code: data.botMessageCode
            };
            setIsSending(false);
            errorStream(event);
        });

        connection.onreconnecting(() => {
            console.log("🔄 SignalR Stream reconnecting...");
            setConnection(false);
        });

        connection.onreconnected(async (connectionId?: string) => {
            try {
                await connection.invoke("JoinChatRoom", deviceId);
                setConnection(true, connectionId || undefined);
                setIsSending(false);
                // Reset failure count on successful reconnection
                connectionFailures.current = 0;
                
                // Track successful reconnection
                if (enableMonitoring) {
                    streamMonitor.recordConnectionSuccess();
                }
            } catch (error) {
                console.error("❌ Failed to rejoin chat room:", error);
                setIsSending(false);
                
                // Track connection failure
                if (enableMonitoring) {
                    streamMonitor.recordConnectionFailure();
                }
                
                // Trigger debounced reconnect if rejoin fails
                debouncedReconnect(3000);
            }
        });

        connection.onclose(async (error?: Error) => {
            console.warn("❌ SignalR connection closed:", error);
            setConnection(false);
            setIsSending(false);
            
            // Clear any pending batched chunks
            if (batchTimeoutRef.current) {
                clearTimeout(batchTimeoutRef.current);
                chunkBuffer.current = [];
            }
            
            // Use debounced reconnection instead of direct setTimeout
            if (autoReconnect && connectionFailures.current < 5) {
                const delay = Math.min(3000 * (connectionFailures.current + 1), 15000);
                debouncedReconnect(delay);
            }
        });

    }, [completeStream, errorStream, setConnection, sessionId, processBatchedChunks, setIsSending, deviceId, autoReconnect, debouncedReconnect, enableMonitoring]);

    const mountedRef = useRef(true);
    const connectionAttemptRef = useRef<AbortController | null>(null);

    const connect = useCallback(async () => {
        // Clear any pending reconnection
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        
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
            logSignalRDiagnostics();
            const diagnostics = getSignalRDiagnostics();

            console.log(`🔧 Using ${diagnostics.suggestedTransport} transport for ${diagnostics.platform} platform`);

            let connection: signalR.HubConnection;
            let usedFallback = false;

            // Cải thiện connection strategy với fallback mechanism
            try {
                // First try: Sử dụng createConnectionWithFallback để tự động thử các transport
                console.log("🚀 Attempting connection with fallback mechanism...");
                connection = await createConnectionWithFallback(
                    ENV.BE + "/chatHub",
                    () => localStorage.getItem("token") || ""
                );
                usedFallback = true;
                console.log("✅ Connected successfully with fallback mechanism");
            } catch (fallbackError: any) {
                console.warn("⚠️ Fallback mechanism failed, trying manual connection:", fallbackError.message);
                
                // Fallback to manual connection
                connection = createMobileOptimizedConnection(
                    ENV.BE + "/chatHub",
                    () => localStorage.getItem("token") || "",
                    signalR.HttpTransportType.LongPolling
                );

                // Manual retry logic với improved error handling
                let retryCount = 0;
                while (retryCount < maxRetries) {
                    try {
                        if (connectionAttemptRef.current?.signal.aborted) {
                            console.log("🛑 Connection attempt was aborted");
                            return;
                        }

                        await connection.start();
                        console.log("✅ Manual connection succeeded");
                        break;
                    } catch (startError: any) {
                        retryCount++;
                        console.warn(`⚠️ SignalR connection attempt ${retryCount} failed:`, startError.message);

                        // Specific error handling
                        if (startError.message.includes('CORS') || startError.message.includes('cross-origin')) {
                            console.error('🚫 CORS error detected. Server CORS configuration cần được kiểm tra.');
                            
                            // Gợi ý cho user
                            if (window.location.protocol === 'http:' && ENV.BE.includes('https:')) {
                                console.warn('⚠️ Mixed content issue: trying to connect HTTPS from HTTP');
                            }
                            
                            // Suggest fallback for CORS issues
                            if (retryCount === 1) {
                                console.log('🔄 Trying with different transport for CORS issue...');
                                connection = createMobileOptimizedConnection(
                                    ENV.BE + "/chatHub",
                                    () => localStorage.getItem("token") || "",
                                    signalR.HttpTransportType.LongPolling
                                );
                                continue;
                            }
                        } else if (startError.message.includes('504') || startError.message.includes('Gateway Timeout')) {
                            console.error('⏰ Gateway Timeout detected. Server có thể đang overloaded hoặc có vấn đề network.');
                            
                            // Increase delay for timeout issues
                            const timeoutDelay = Math.min(5000 * retryCount, 20000);
                            console.log(`⏰ Waiting ${timeoutDelay}ms before retry due to timeout...`);
                            await new Promise(resolve => setTimeout(resolve, timeoutDelay));
                        } else if (startError.message.includes('Failed to fetch') || startError.message.includes('TypeError')) {
                            console.error('🌐 Network connectivity issue detected.');
                            
                            // Check if device is online
                            if (!navigator.onLine) {
                                console.error('📱 Device appears to be offline');
                                throw new Error('Device is offline');
                            }
                        }

                        if (retryCount >= maxRetries) {
                            throw startError;
                        }

                        // Exponential backoff với jitter
                        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
                        const jitter = Math.random() * 1000;
                        await new Promise(resolve => setTimeout(resolve, delay + jitter));
                    }
                }
            }

            connectionRef.current = connection;
            setupEventHandlers(connection);

            // Join chat room
            try {
                await connection.invoke("JoinChatRoom", deviceId);
                console.log("✅ Successfully joined chat room");
            } catch (joinError: any) {
                console.error("❌ Failed to join chat room:", joinError.message);
                // Still proceed với connection nếu join fail
            }

            setConnection(true, connection.connectionId || undefined);
            connectionFailures.current = 0;
            console.log("✅ SignalR connected successfully" + (usedFallback ? " (with fallback)" : ""));

            // Track successful connection in monitor
            if (enableMonitoring) {
                streamMonitor.recordConnectionSuccess();
            }

        } catch (error: any) {
            console.error("❌ SignalR Stream connection failed:", error);
            connectionFailures.current++;
            lastConnectionAttempt.current = new Date();

            // Track connection failure in monitor
            if (enableMonitoring) {
                streamMonitor.recordConnectionFailure();
            }

            if (mountedRef.current && !connectionAttemptRef.current?.signal.aborted) {
                setConnection(false);

                // Enhanced error reporting
                if (error.message.includes('CORS')) {
                    console.error(`
🚫 CORS Error Analysis:
   - Current origin: ${window.location.origin}
   - Target server: ${ENV.BE}
   - Suggestion: Kiểm tra server CORS configuration
   - Mixed content: ${window.location.protocol !== ENV.BE.split(':')[0] + ':' ? 'YES' : 'NO'}
                    `);
                } else if (error.message.includes('504') || error.message.includes('Gateway Timeout')) {
                    console.error(`
⏰ Gateway Timeout Analysis:
   - Server: ${ENV.BE}
   - Suggestion: Server có thể đang busy hoặc có vấn đề infrastructure
   - Retry recommended với longer delays
                    `);
                } else if (error.message.includes('Failed to fetch')) {
                    console.error(`
🌐 Network Error Analysis:
   - Device online: ${navigator.onLine ? 'YES' : 'NO'}
   - Suggestion: Kiểm tra network connectivity và firewall
                    `);
                }

                if (connectionFailures.current === 1) {
                    console.warn("⚠️ First connection attempt failed. This is common on mobile devices.");
                } else if (connectionFailures.current >= 3) {
                    console.error("🚨 Multiple connection failures detected. Consider switching to fallback mode.");
                }

                if (autoReconnect && connectionFailures.current < 5) {
                    // Adaptive retry delay based on error type
                    let retryDelay = Math.min(5000 * connectionFailures.current, 30000);
                    
                    if (error.message.includes('504') || error.message.includes('Gateway Timeout')) {
                        retryDelay = Math.min(10000 * connectionFailures.current, 60000); // Longer delay for timeouts
                    } else if (error.message.includes('CORS')) {
                        retryDelay = Math.min(2000 * connectionFailures.current, 10000); // Shorter delay for CORS (likely config issue)
                    }
                    
                    console.log(`🔄 Auto-retrying SignalR connection in ${retryDelay}ms (attempt ${connectionFailures.current + 1})`);
                    debouncedReconnect(retryDelay);
                } else if (connectionFailures.current >= 5) {
                    console.error("🛑 Maximum connection attempts reached. Manual retry required.");
                    console.error("💡 Suggestions:");
                    console.error("   1. Kiểm tra network connectivity");
                    console.error("   2. Verify server is running");
                    console.error("   3. Check CORS configuration");
                    console.error("   4. Try manual retry");
                }
            }
        }
    }, [deviceId, autoReconnect, logLevel, setupEventHandlers, setConnection, maxRetries, debouncedReconnect, enableMonitoring]);

    useEffect(() => {
        mountedRef.current = true;

        connect();
        return () => {
            mountedRef.current = false;
            
            // Cleanup all timeouts
            if (connectionAttemptRef.current) {
                connectionAttemptRef.current.abort();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (batchTimeoutRef.current) {
                clearTimeout(batchTimeoutRef.current);
            }
            
            if (connectionRef.current) {
                connectionRef.current.stop();
                connectionRef.current = null;
            }
            setConnection(false);
        };
    }, [connect, setConnection]);

    const sendStreamMessage = useCallback(async (
        chatCode: string,
        message: string,
        additionalData?: any
    ): Promise<string> => {
        // Kiểm tra connection state tốt hơn
        if (!connectionRef.current) {
            console.error("❌ No SignalR connection available");
            throw new Error("SignalR connection is not available");
        }

        const connectionState = connectionRef.current.state;
        console.log("🔍 Connection state before send:", connectionState);

        if (connectionState !== signalR.HubConnectionState.Connected) {
            console.error("❌ SignalR not connected, current state:", connectionState);
            
            // Cải thiện reconnection logic
            if (connectionState === signalR.HubConnectionState.Disconnected) {
                console.log("🔄 Attempting to reconnect...");
                try {
                    await connect();
                    // Wait shorter time cho connection stability
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
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
            
            // Track stream start in monitor
            if (enableMonitoring) {
                streamMonitor.startStream(messageCode, chatCode);
            }
            
            // Sử dụng timeout ngắn hơn và có thể config
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`SendStreamMessage timeout after ${sendTimeout}ms for message: ${messageCode}`)), sendTimeout)
            );

            const sendPromise = connectionRef.current.invoke("SendStreamMessage", payload);
            
            await Promise.race([sendPromise, timeoutPromise]);
            
            console.log("✅ Stream message sent successfully:", messageCode);
            return messageCode;

        } catch (error) {
            console.error("❌ Failed to send stream message:", error);
            
            // Improved error recovery
            if (connectionRef.current && connectionRef.current.state !== signalR.HubConnectionState.Connected) {
                console.warn("⚠️ Connection lost during send, attempting to reconnect...");
                setConnection(false);
                // Use debounced reconnection
                debouncedReconnect(1000);
            }
            
            throw error;
        }
    }, [deviceId, connect, setConnection, sendTimeout, debouncedReconnect, enableMonitoring]);


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
    }, [connect]);

    // Enhanced connection health monitoring
    const getConnectionStats = useCallback(() => ({
        failures: connectionFailures.current,
        lastAttempt: lastConnectionAttempt.current,
        isRetrying: connectionFailures.current > 0 && connectionFailures.current < 5,
        connectionState: connectionRef.current?.state || 'Disconnected',
        isHealthy: isConnected && connectionFailures.current === 0
    }), [isConnected]);

    // Enhanced stream statistics với performance metrics
    const streamStats = useMemo(() => {
        const activeStreams = getActiveStreams();
        const completedStreams = getCompletedStreams();
        const errorStreams = getErrorStreams();

        return {
            total: activeStreams.length + completedStreams.length + errorStreams.length,
            active: activeStreams.length,
            completed: completedStreams.length,
            errors: errorStreams.length,
            successRate: completedStreams.length > 0 ? 
                (completedStreams.length / (completedStreams.length + errorStreams.length)) * 100 : 
                100,
            avgChunksPerStream: activeStreams.length > 0 ? 
                activeStreams.reduce((sum, stream) => sum + (stream.chunks?.length || 0), 0) / activeStreams.length : 
                0
        };
    }, [getActiveStreams, getCompletedStreams, getErrorStreams]);

    // Connection health check với auto-healing
    useEffect(() => {
        if (!isConnected || !connectionRef.current) return;

        const healthCheckInterval = setInterval(async () => {
            try {
                // Ping server để check connection health
                if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
                    // Simple ping to keep connection alive
                    await connectionRef.current.invoke("Ping").catch(() => {
                        console.warn("⚠️ Health check ping failed, connection may be stale");
                        // Connection might be stale, trigger reconnection
                        debouncedReconnect(1000);
                    });
                }
            } catch (error) {
                console.warn("⚠️ Health check failed:", error);
            }
        }, 30000); // Check every 30 seconds

        return () => clearInterval(healthCheckInterval);
    }, [isConnected, debouncedReconnect]);

    // Cleanup effect để đảm bảo no memory leaks
    useEffect(() => {
        return () => {
            // Clear all pending chunks
            chunkBuffer.current = [];
            
            // Clear all timeouts
            if (batchTimeoutRef.current) {
                clearTimeout(batchTimeoutRef.current);
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, []);

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

        // Enhanced stats với performance metrics
        streamStats,

        // Monitoring utilities (chỉ available khi enableMonitoring = true)
        ...(enableMonitoring && {
            getPerformanceReport: () => streamMonitor.getPerformanceReport(),
            exportLogs: () => streamMonitor.exportLogs(),
            clearOldMetrics: (ms?: number) => streamMonitor.clearOldMetrics(ms),
            streamMonitor: streamMonitor
        })
    };
};
