import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import ENV from "@/config/env";
import { useChatStore } from "@/store/zustand/chat-store";

export function useSignalRChat(deviceId: string) {
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<object[]>([]);
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    useEffect(() => {
        const linkBE = ENV.BE;

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(linkBE + "/chatHub", {
                accessTokenFactory: () => localStorage.getItem("token") || "",
            })
            .withAutomaticReconnect()
            .build();

        connectionRef.current = connection;

        const startConnection = async () => {
            try {
                await connection.start();
                setIsConnected(true);
                await connection.invoke("JoinChatRoom", deviceId);
                connection.on("ReceiveMessage", (message: object) => {
                    setMessages((prev) => [...prev, message]);
                    useChatStore.getState().setIsSending(false);
                });
                connection.onclose(async (error) => {
                    setIsConnected(false);
                });
                connection.onreconnecting(() => setIsConnected(false));
                connection.onreconnected(() => {
                    setIsConnected(true);
                    connection.invoke("JoinChatRoom", deviceId);
                });
            } catch (error) {
                setIsConnected(false);
                console.error("SignalR Connection Error:", error);
            }
        };

        startConnection();

        return () => {
            connection.stop();
        };
    }, [deviceId]);

    const sendMessage = async (method: string, ...args: any[]) => {
        if (connectionRef.current && isConnected) {
            await connectionRef.current.invoke(method, ...args);
        }
    };

    return { isConnected, messages, sendMessage, setMessages };
}