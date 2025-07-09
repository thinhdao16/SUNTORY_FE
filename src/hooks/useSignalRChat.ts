import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import ENV from "@/config/env";
import { useSignalRChatStore } from "@/store/zustand/signalr-chat-store";
import { useChatStore } from "@/store/zustand/chat-store";
import { useAuthStore } from "@/store/zustand/auth-store";

export function useSignalRChat(deviceId: string) {
    const setIsConnected = useSignalRChatStore((s) => s.setIsConnected);
    const addMessage = useSignalRChatStore((s) => s.addMessage);
    const setSendMessage = useSignalRChatStore((s) => s.setSendMessage);
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const setIsSending = useChatStore.getState().setIsSending;
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (connectionRef.current) {
            connectionRef.current.stop();
            connectionRef.current = null;
        }

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(ENV.BE + "/chatHub", {
                accessTokenFactory: () => localStorage.getItem("token") || "",
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        connectionRef.current = connection;

        connection
            .start()
            .then(() => {
                setIsConnected("connected");
                return connection.invoke("JoinChatRoom", deviceId);
            })
            .catch((err) => {
                console.error("❌ Connect error", err);
                setIsConnected("disconnected");
            });

        const handleReceive = (msg: any) => {
            addMessage(msg);
            useChatStore.getState().setIsSending(false);
        };

        connection.on("ReceiveMessage", handleReceive);

        connection.onclose((err) => {
            setIsSending(false);
            console.log("❌ Closed", err);
            setIsConnected("disconnected");

            if (!err) return;

            setTimeout(() => {
                if (connectionRef.current?.state === signalR.HubConnectionState.Disconnected) {
                    connectionRef.current?.start().catch(console.error);
                }
            }, 5000);
        });


        connection.onreconnecting(() => {
            setIsConnected("connecting");
            setIsSending(false);

        });

        connection.onreconnected(() => {
            setIsConnected("connected");
            setIsSending(false);

            connection.invoke("JoinChatRoom", deviceId).catch(console.error);
        });
        setSendMessage(async (method: string, ...args: any[]) => {
            try {
                setIsSending(true);

                if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
                    await connectionRef.current.invoke(method, ...args);
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
            connection.stop();
            connectionRef.current = null;
        };
    }, [deviceId, setIsConnected, addMessage, setSendMessage, isAuthenticated]);
}
