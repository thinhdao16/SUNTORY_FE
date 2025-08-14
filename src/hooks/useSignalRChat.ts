/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import ENV from "@/config/env";
import { useSignalRChatStore } from "@/store/zustand/signalr-chat-store";
import { useChatStore } from "@/store/zustand/chat-store";
import { useAuthStore } from "@/store/zustand/auth-store";
import { useSignalRStreamStore } from "@/store/zustand/signalr-stream-store";
import { streamText } from "@/utils/streamText";

export function useSignalRChat(deviceId: string) {
    const setIsConnected = useSignalRChatStore((s) => s.setIsConnected);

    const { addStreamChunk, completeStream , setLoadingStream } = useSignalRStreamStore();
    const setSendMessage = useSignalRChatStore((s) => s.setSendMessage);
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const setIsSending = useChatStore.getState().setIsSending;
    const { isAuthenticated } = useAuthStore();
    useEffect(() => {
        if (!isAuthenticated) return;

        if (connectionRef.current) {
            connectionRef.current.stop().catch(() => { });
            connectionRef.current = null;
        }
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${ENV.BE}/chatHub`, {
                accessTokenFactory: () => localStorage.getItem("token") || "",
                transport: signalR.HttpTransportType.WebSockets,
                skipNegotiation: true,
            })
            .withAutomaticReconnect([0, 2000, 10000, 30000])
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        connectionRef.current = connection;

        const startConn = async () => {
            if (connection.state === signalR.HubConnectionState.Connected) return;
            await connection.start();
            await connection.invoke("JoinChatRoom", deviceId);
            setIsConnected("connected");
        };

        startConn().catch(err => {
            console.error("❌ Connect error", err);
            setIsConnected("disconnected");
        });

        const handleReceive = (msg: any) => {
            const fullText: string = msg?.messageText ?? "";

            const chatCode = msg?.chatInfo?.code ?? String(msg?.chatInfoId ?? "");
            const messageCode = msg?.code || `${chatCode}:${msg?.id}`;

            const meta = {
                id: msg?.id,
                code: msg?.code,
                chatCode,
                messageCode,
            };
            setLoadingStream(true);
            streamText(fullText, meta, addStreamChunk, setLoadingStream, completeStream);
        };
        connection.on("ReceiveMessage", handleReceive);

        connection.onclose(() => {
            setIsSending(false);
            setIsConnected("disconnected");
            setTimeout(() => startConn().catch(console.error), 5000);
        });

        connection.onreconnecting(() => setIsConnected("connecting"));
        connection.onreconnected(() => {
            setIsConnected("connected");
            connection.invoke("JoinChatRoom", deviceId).catch(console.error);
        });

        setSendMessage(async (method: string, ...args: any[]) => {
            try {
                setIsSending(true);
                if (connection.state === signalR.HubConnectionState.Connected) {
                    await connection.invoke(method, ...args);
                } else {
                    throw new Error("SignalR is not connected");
                }
            } catch (error) {
                console.error("⚠️ Failed to send message", error);
            } finally {
                setIsSending(false);
            }
        });

        return () => {
            connection.off("ReceiveMessage", handleReceive);
            connection.stop().catch(() => { });
            connectionRef.current = null;
        };
    }, [deviceId, isAuthenticated]);

}
