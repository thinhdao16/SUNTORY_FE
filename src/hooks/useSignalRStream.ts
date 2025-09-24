/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import ENV from "@/config/env";
import {
    useSignalRStreamStore,
    StreamChunk,
    StreamEvent,
} from "@/store/zustand/signalr-stream-store";
import { useChatStore } from "@/store/zustand/chat-store";
import { useParams } from 'react-router';

export interface UseSignalRStreamOptions {
    logLevel?: signalR.LogLevel;
    sendTimeoutMs?: number;
    preferWebSockets?: boolean; 
}

export interface UseSignalRStreamReturn {
    isConnected: boolean;
    connectionId?: string;
    getStreamMessage: (messageCode: string) => any;
    getStreamMessagesByChatCode: (chatCode: string) => any[];
    getActiveStreams: () => any[];
    sendStreamMessage: (
        chatCode: string,
        message: string,
        additionalData?: any
    ) => Promise<string>;
    clearStream: (messageCode: string) => void;
    clearChatStreams: (chatCode: string) => void;
    isStreamActive: (messageCode: string) => boolean;
    isStreamComplete: (messageCode: string) => boolean;
    hasStreamError: (messageCode: string) => boolean;
    getStreamError: (messageCode: string) => string | null;
    manualRetry: () => void;
    forceResetLoading: () => void;
}

export function useSignalRStream(
    deviceId: string,
    options: UseSignalRStreamOptions = {}
): UseSignalRStreamReturn {
    const {
        logLevel = signalR.LogLevel.Warning,
        sendTimeoutMs = 15000,
        preferWebSockets = true,
    } = options;
    const { sessionId } = useParams<{ sessionId?: string; type?: string }>();

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
    } = useSignalRStreamStore();

    const setIsSending = useChatStore.getState().setIsSending;

    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const startedForDeviceRef = useRef<string | null>(null);
    const joinedForDeviceRef = useRef<string | null>(null);

    const connectingRef = useRef(false);
    const startPromiseRef = useRef<Promise<void> | null>(null);
    const manualRetryRef = useRef<(() => void) | undefined>(undefined);
    
    // Network quality tracking
    const networkQualityRef = useRef<'good' | 'poor' | 'offline'>('good');
    const lastChunkTimeRef = useRef<{ [key: string]: number }>({});
    const streamBufferRef = useRef<{ [key: string]: any[] }>({});

    // ====== Helpers ======
    const buildConnection = useCallback(() => {
        const tokenFactory = () => localStorage.getItem("token") || "";

        const builder = new signalR.HubConnectionBuilder().configureLogging(logLevel);

        if (preferWebSockets) {
            builder.withUrl(`${ENV.BE}/chatHub`, {
                accessTokenFactory: tokenFactory,
                transport: signalR.HttpTransportType.WebSockets,
                skipNegotiation: true,
            });
        } else {
            builder.withUrl(`${ENV.BE}/chatHub`, {
                accessTokenFactory: tokenFactory,
            });
        }

        // Exponential backoff với jitter để tránh thundering herd
        builder.withAutomaticReconnect({
            nextRetryDelayInMilliseconds: (retryContext) => {
                const baseDelay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
                const jitter = Math.random() * 1000;
                const delay = baseDelay + jitter;
                
                console.log(`[SignalR] Retry attempt ${retryContext.previousRetryCount + 1}, delay: ${delay}ms`);
                
                // Nếu retry quá 5 lần, có thể network rất tệ
                if (retryContext.previousRetryCount > 5) {
                    networkQualityRef.current = 'offline';
                    console.error('[SignalR] Network appears offline after 5 retries');
                }
                
                return delay;
            }
        });

        return builder.build();
    }, [logLevel, preferWebSockets]);

    const attachHandlers = useCallback((conn: signalR.HubConnection) => {
        conn.off("ReceiveStreamChunk");
        conn.off("StreamComplete");
        conn.off("StreamError");

        conn.on(
            "ReceiveStreamChunk",
            (data: {
                botMessageCode: string;
                botMessageId: number;
                chatCode: string;
                chunk: string;
                completeText: string;
                userMessageCode: string;
                userMessageId: number;
                chunkLength: number;
            }) => {
                if (!data.chatCode || !data.userMessageCode || data.chunkLength === 0) {
                    console.warn('[SignalR] Invalid stream chunk data:', data);
                    return;
                }
                console.log(data)
                if (data.chatCode !== sessionId) {
                    console.log(`[SignalR] Ignoring chunk for different session: ${data.chatCode} !== ${sessionId}`);
                    return;
                }
                
                const chunk: StreamChunk = {
                    id: data.botMessageId,
                    chatCode: data.chatCode,
                    messageCode: data.userMessageCode,
                    chunk: data.chunk,
                    completeText: data.completeText,
                    userMessageId: data.userMessageId,
                    code: data.botMessageCode,
                    timestamp: new Date().toISOString(),
                };
                
                const now = Date.now();
                const messageKey = data.userMessageCode;
                if (lastChunkTimeRef.current[messageKey]) {
                    const timeDiff = now - lastChunkTimeRef.current[messageKey];
                    if (timeDiff > 5000) {
                        networkQualityRef.current = 'poor';
                        console.warn(`[SignalR] Poor network: ${timeDiff}ms between chunks`);
                    } else {
                        networkQualityRef.current = 'good';
                    }
                }
                lastChunkTimeRef.current[messageKey] = now;
                
                // Add chunk immediately
                addStreamChunk(chunk);
                
                // Set loading state for first chunk
                const existingStream = getStreamMessage(data.userMessageCode);
                if (!existingStream || existingStream.chunks.length === 0) {
                    setIsSending(true);
                }
            }
        );

        conn.on(
            "StreamComplete",
            (data: {
                botMessageCode: string;
                botMessageId: number;
                chatCode: string;
                userMessageCode: string;
            }) => {
                // Validate data
                if (!data.chatCode || !data.userMessageCode) {
                    console.warn('[SignalR] Invalid StreamComplete data:', data);
                    return;
                }
                
                console.log('[SignalR] StreamComplete:', {
                    chatCode: data.chatCode,
                    currentSessionId: sessionId,
                    isForCurrentSession: data.chatCode === sessionId,
                    messageCode: data.userMessageCode
                });
                
                // ONLY process completion for current session
                if (data.chatCode !== sessionId) {
                    console.log(`[SignalR] Ignoring completion for different session: ${data.chatCode}`);
                    return;
                }
                
                const event: StreamEvent = {
                    id: data.botMessageId,
                    chatCode: data.chatCode,
                    messageCode: data.userMessageCode,
                    timestamp: new Date().toISOString(),
                    code: data.botMessageCode,
                };
                
                // Complete stream and reset loading
                completeStream(event);
                setIsSending(false);
                
                // Clean up tracking
                delete lastChunkTimeRef.current[data.userMessageCode];
                delete streamBufferRef.current[data.userMessageCode];
            }
        );

        conn.on(
            "StreamError",
            (data: {
                botMessageCode: string;
                botMessageId: number;
                chatCode: string;
                userMessageCode: string;
                errorMessage: string;
            }) => {
                // Validate data
                if (!data.chatCode || !data.userMessageCode) {
                    console.warn('[SignalR] Invalid StreamError data:', data);
                    return;
                }
                
                console.log('[SignalR] StreamError:', {
                    chatCode: data.chatCode,
                    currentSessionId: sessionId,
                    isForCurrentSession: data.chatCode === sessionId,
                    messageCode: data.userMessageCode,
                    error: data.errorMessage
                });
                
                // ONLY process error for current session
                if (data.chatCode !== sessionId) {
                    console.log(`[SignalR] Ignoring error for different session: ${data.chatCode}`);
                    return;
                }
                
                const event: StreamEvent = {
                    id: data.botMessageId,
                    chatCode: data.chatCode,
                    messageCode: data.userMessageCode,
                    timestamp: new Date().toISOString(),
                    errorMessage: data.errorMessage,
                    code: data.botMessageCode,
                };
                
                // Handle error and reset loading
                errorStream(event);
                setIsSending(false);
                
                // Clean up tracking
                delete lastChunkTimeRef.current[data.userMessageCode];
                delete streamBufferRef.current[data.userMessageCode];
            }
        );

        conn.onreconnecting((error) => {
            console.log('[SignalR] Reconnecting...', error?.message);
            setConnection(false);
            setIsSending(false);
            networkQualityRef.current = 'poor';
        });
        
        conn.onreconnected(async (connectionId) => {
            console.log('[SignalR] Reconnected with ID:', connectionId);
            setConnection(true, connectionId || undefined);
            setIsSending(false);
            networkQualityRef.current = 'good';
            
            // ALWAYS rejoin room after reconnect
            try {
                await conn.invoke("JoinChatRoom", deviceId);
                joinedForDeviceRef.current = deviceId;
                console.log('[SignalR] Rejoined chat room:', deviceId);
                
                // Request recovery of incomplete streams for current session
                if (sessionId) {
                    const activeStreams = getActiveStreams();
                    const sessionStreams = activeStreams.filter(s => s.chatCode === sessionId);
                    
                    if (sessionStreams.length > 0) {
                        console.log(`[SignalR] Found ${sessionStreams.length} incomplete streams for session ${sessionId}`);
                        
                        // Try to recover each stream
                        for (const stream of sessionStreams) {
                            try {
                                await conn.invoke("RecoverStream", {
                                    messageCode: stream.messageCode,
                                    chatCode: stream.chatCode,
                                    lastChunkIndex: stream.chunks.length
                                });
                                console.log(`[SignalR] Requested recovery for stream ${stream.messageCode}`);
                            } catch (err) {
                                console.error(`[SignalR] Failed to recover stream ${stream.messageCode}:`, err);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("[SignalR] Failed to rejoin chat room:", e);
                // Try manual retry if rejoin fails
                setTimeout(() => {
                    if (manualRetryRef.current) {
                        manualRetryRef.current();
                    }
                }, 2000);
            }
        });

        conn.onclose(() => {
            setConnection(false);
            setIsSending(false);
            joinedForDeviceRef.current = null;
        });
    }, [addStreamChunk, completeStream, errorStream, setConnection, setIsSending, deviceId, sessionId, getActiveStreams]);

    const connect = useCallback(async () => {
        if (startedForDeviceRef.current === deviceId && connectionRef.current) {
            const s = connectionRef.current.state;
            if (s === signalR.HubConnectionState.Connected || s === signalR.HubConnectionState.Connecting || s === signalR.HubConnectionState.Reconnecting) {
                return startPromiseRef.current ?? Promise.resolve();
            }
        }

        if (connectingRef.current) {
            return startPromiseRef.current ?? Promise.resolve();
        }

        if (connectionRef.current) {
            try { await connectionRef.current.stop(); } catch { }
            connectionRef.current = null;
        }

        const conn = buildConnection();
        attachHandlers(conn);
        connectionRef.current = conn;

        connectingRef.current = true;
        const startPromise = conn.start()
            .then(async () => {
                setConnection(true, conn.connectionId || undefined);
                try {
                    await conn.invoke("JoinChatRoom", deviceId);
                    joinedForDeviceRef.current = deviceId;
                } catch {
                }
                startedForDeviceRef.current = deviceId;
            })
            .finally(() => {
                connectingRef.current = false;
            });

        startPromiseRef.current = startPromise;
        return startPromise;
    }, [attachHandlers, buildConnection, deviceId, setConnection]);

    // Recovery mechanism cho incomplete streams sau khi reload
    const recoverIncompleteStreams = useCallback(async () => {
        const activeStreams = getActiveStreams();
        if (activeStreams.length > 0) {
            console.log(`[SignalR] Recovering ${activeStreams.length} incomplete streams`);
            
            // Đợi connection stable
            let retries = 0;
            while (!isConnected && retries < 10) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                retries++;
            }
            
            if (isConnected) {
                // Request backend resend incomplete streams
                activeStreams.forEach(stream => {
                    console.log(`[SignalR] Requesting recovery for stream ${stream.messageCode}`);
                    
                    // Nếu stream đã quá 60s mà chưa complete, force complete
                    const streamAge = Date.now() - new Date(stream.startTime).getTime();
                    if (streamAge > 60000) {
                        console.warn(`[SignalR] Stream ${stream.messageCode} too old (${streamAge}ms), force completing`);
                        completeStream({
                            id: stream.id,
                            chatCode: stream.chatCode,
                            messageCode: stream.messageCode,
                            timestamp: new Date().toISOString(),
                            code: stream.code,
                        });
                        setIsSending(false);
                    } else {
                        // Try to request resend from backend
                        const conn = connectionRef.current;
                        if (conn && conn.state === signalR.HubConnectionState.Connected) {
                            conn.invoke("RecoverStream", {
                                messageCode: stream.messageCode,
                                chatCode: stream.chatCode,
                                lastChunkIndex: stream.chunks.length
                            }).catch(err => {
                                console.error(`[SignalR] Failed to recover stream ${stream.messageCode}:`, err);
                                // Fallback: force complete nếu không recover được
                                completeStream({
                                    id: stream.id,
                                    chatCode: stream.chatCode,
                                    messageCode: stream.messageCode,
                                    timestamp: new Date().toISOString(),
                                    code: stream.code,
                                });
                                setIsSending(false);
                            });
                        }
                    }
                });
            }
        }
    }, [getActiveStreams, isConnected, completeStream, setIsSending]);

    useEffect(() => {
        if (!deviceId) return;
        void connect();
        
        // Recover incomplete streams after connection
        setTimeout(() => {
            recoverIncompleteStreams();
        }, 2000);

        return () => {
            (async () => {
                try { await connectionRef.current?.stop(); } catch { }
                connectionRef.current = null;
                startedForDeviceRef.current = null;
                joinedForDeviceRef.current = null;
                startPromiseRef.current = null;
                connectingRef.current = false;
                setConnection(false);
                setIsSending(false);
            })();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deviceId]);

    const sendStreamMessage = useCallback(
        async (chatCode: string, message: string, additionalData?: any) => {
            const conn = connectionRef.current;
            if (!conn || conn.state !== signalR.HubConnectionState.Connected) {
                setIsSending(false); // Reset loading state khi connection fail
                throw new Error("SignalR is not connected. Vui lòng đợi kết nối ổn định.");
            }

            const messageCode = `stream_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            const payload = {
                deviceId,
                chatCode,
                messageCode,
                message,
                timestamp: new Date().toISOString(),
                ...additionalData,
            };

            const timeout = new Promise<never>((_, reject) =>
                setTimeout(() => {
                    setIsSending(false); // Reset loading state khi timeout
                    reject(new Error(`SendStreamMessage timeout ${sendTimeoutMs}ms`));
                }, sendTimeoutMs)
            );

            try {
                await Promise.race([conn.invoke("SendStreamMessage", payload), timeout]);
                
                // Thêm fallback timeout cho stream completion
                setTimeout(() => {
                    const streamMsg = getStreamMessage(messageCode);
                    if (streamMsg && streamMsg.isStreaming && !streamMsg.isComplete) {
                        console.warn(`Stream ${messageCode} không complete sau 60s, force complete`);
                        completeStream({
                            id: streamMsg.id,
                            chatCode,
                            messageCode,
                            timestamp: new Date().toISOString(),
                            code: streamMsg.code,
                        });
                        setIsSending(false);
                    }
                }, 60000); // 60 giây fallback
                
                return messageCode;
            } catch (error) {
                setIsSending(false); // Reset loading state khi có error
                throw error;
            }
        },
        [deviceId, sendTimeoutMs, getStreamMessage, completeStream, setIsSending]
    );

    const manualRetry = useCallback(() => {
        if (!deviceId) return;
        // Reset tất cả states khi manual retry
        setIsSending(false);
        startedForDeviceRef.current = null;
        joinedForDeviceRef.current = null;
        void connect();
    }, [connect, deviceId, setIsSending]);
    
    // Set ref for manualRetry to avoid circular dependency
    useEffect(() => {
        manualRetryRef.current = manualRetry;
    }, [manualRetry]);

    // Thêm function để force reset loading state
    const forceResetLoading = useCallback(() => {
        setIsSending(false);
        console.warn("Force reset loading state");
    }, [setIsSending]);
    useEffect(() => {
        const onOnline = () => {
            if (connectionRef.current?.state === signalR.HubConnectionState.Disconnected) manualRetry();
        };
        const onVisible = () => {
            if (document.visibilityState === 'visible' &&
                connectionRef.current?.state === signalR.HubConnectionState.Disconnected) {
                manualRetry();
            }
        };
        window.addEventListener('online', onOnline);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            window.removeEventListener('online', onOnline);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [manualRetry]);

    // Heartbeat mechanism để keep connection alive
    useEffect(() => {
        if (!isConnected || !connectionRef.current) return;
        
        const heartbeatInterval = setInterval(() => {
            const conn = connectionRef.current;
            if (conn && conn.state === signalR.HubConnectionState.Connected) {
                conn.invoke("Ping").catch(err => {
                    console.warn('[SignalR] Heartbeat failed:', err);
                    // Try to reconnect if heartbeat fails
                    if (conn.state === signalR.HubConnectionState.Disconnected) {
                        manualRetry();
                    }
                });
            }
        }, 30000); // Ping every 30 seconds
        
        return () => clearInterval(heartbeatInterval);
    }, [isConnected, manualRetry]);
    
    // Stale stream detection - check for streams không nhận chunk trong 10s
    useEffect(() => {
        const checkStaleStreams = setInterval(() => {
            const activeStreams = getActiveStreams();
            const now = Date.now();
            
            activeStreams.forEach(stream => {
                const lastUpdate = lastChunkTimeRef.current[stream.messageCode];
                if (lastUpdate && (now - lastUpdate) > 10000) {
                    console.warn(`[SignalR] Stale stream detected: ${stream.messageCode}, last update ${now - lastUpdate}ms ago`);
                    
                    // Nếu stream quá 30s không có update, force complete
                    if ((now - lastUpdate) > 30000) {
                        console.error(`[SignalR] Force completing stale stream: ${stream.messageCode}`);
                        completeStream({
                            id: stream.id,
                            chatCode: stream.chatCode,
                            messageCode: stream.messageCode,
                            timestamp: new Date().toISOString(),
                            code: stream.code,
                        });
                        setIsSending(false);
                        delete lastChunkTimeRef.current[stream.messageCode];
                    }
                }
            });
        }, 5000); // Check every 5 seconds
        
        return () => clearInterval(checkStaleStreams);
    }, [getActiveStreams, completeStream, setIsSending]);

    // ====== selectors/metrics
    const isStreamActive = useCallback(
        (code: string) => {
            const msg = getStreamMessage(code);
            return !!msg?.isStreaming;
        },
        [getStreamMessage]
    );
    const isStreamComplete = useCallback(
        (code: string) => {
            const msg = getStreamMessage(code);
            return !!msg?.isComplete;
        },
        [getStreamMessage]
    );
    const hasStreamError = useCallback(
        (code: string) => {
            const msg = getStreamMessage(code);
            return !!msg?.hasError;
        },
        [getStreamMessage]
    );
    const getStreamError = useCallback(
        (code: string) => {
            const msg = getStreamMessage(code);
            return msg?.errorMessage ?? null;
        },
        [getStreamMessage]
    );

    const streamStats = useMemo(() => {
        const a = getActiveStreams();
        const c = getCompletedStreams();
        const e = getErrorStreams();
        return {
            total: a.length + c.length + e.length,
            active: a.length,
            completed: c.length,
            errors: e.length,
        };
    }, [getActiveStreams, getCompletedStreams, getErrorStreams]);

    return {
        isConnected,
        connectionId,
        getStreamMessage,
        getStreamMessagesByChatCode,
        getActiveStreams,
        sendStreamMessage,
        clearStream,
        clearChatStreams,
        isStreamActive,
        isStreamComplete,
        hasStreamError,
        getStreamError,
        manualRetry,
        forceResetLoading, // Thêm function để force reset
    };
}
