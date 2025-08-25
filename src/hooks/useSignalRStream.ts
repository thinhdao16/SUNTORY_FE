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

        builder.withAutomaticReconnect([0, 2000, 10000, 30000]);

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
            }) => {
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
                addStreamChunk(chunk);
                setIsSending(true);
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
                const event: StreamEvent = {
                    id: data.botMessageId,
                    chatCode: data.chatCode,
                    messageCode: data.userMessageCode,
                    timestamp: new Date().toISOString(),
                    code: data.botMessageCode,
                };
                completeStream(event);
                setIsSending(false);
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
                const event: StreamEvent = {
                    id: data.botMessageId,
                    chatCode: data.chatCode,
                    messageCode: data.userMessageCode,
                    timestamp: new Date().toISOString(),
                    errorMessage: data.errorMessage,
                    code: data.botMessageCode,
                };
                errorStream(event);
                setIsSending(false);
            }
        );

        conn.onreconnecting(() => setConnection(false));
        conn.onreconnected(async () => {
            setConnection(true, conn.connectionId || undefined);
            if (joinedForDeviceRef.current !== deviceId) {
                try {
                    await conn.invoke("JoinChatRoom", deviceId);
                    joinedForDeviceRef.current = deviceId;
                } catch (e) {
                }
            }
        });

        conn.onclose(() => {
            setConnection(false);
            setIsSending(false);
            joinedForDeviceRef.current = null;
        });
    }, [addStreamChunk, completeStream, errorStream, setConnection, setIsSending, deviceId]);

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

    useEffect(() => {
        if (!deviceId) return;
        void connect();

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
                setTimeout(() => reject(new Error(`SendStreamMessage timeout ${sendTimeoutMs}ms`)), sendTimeoutMs)
            );

            await Promise.race([conn.invoke("SendStreamMessage", payload), timeout]);
            return messageCode;
        },
        [deviceId, sendTimeoutMs]
    );

    const manualRetry = useCallback(() => {
        if (!deviceId) return;
        startedForDeviceRef.current = null;
        joinedForDeviceRef.current = null;
        void connect();
    }, [connect, deviceId]);
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
    };
}
