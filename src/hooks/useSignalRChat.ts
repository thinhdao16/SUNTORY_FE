import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import ENV from "@/config/env";
import { useSignalRChatStore } from "@/store/zustand/signalr-chat-store";
import { useChatStore } from "@/store/zustand/chat-store";

export function useSignalRChat(deviceId: string) {
    const setIsConnected = useSignalRChatStore((s) => s.setIsConnected);
    const setMessages = useSignalRChatStore((s) => s.setMessages);
    const addMessage = useSignalRChatStore((s) => s.addMessage);
    const setSendMessage = useSignalRChatStore((s) => s.setSendMessage);

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

        let isCancelled = false;

        const startConnection = async () => {
            try {
                await connection.start();
                if (isCancelled) {
                    await connection.stop();
                    return;
                }

                setIsConnected(true);
                await connection.invoke("JoinChatRoom", deviceId);

                connection.on("ReceiveMessage", (message: object) => {
                    setMessages([...useSignalRChatStore.getState().messages, message]);
                    useChatStore.getState().setIsSending(false);
                });

                connection.onclose(() => setIsConnected(false));
                connection.onreconnecting(() => setIsConnected(false));
                connection.onreconnected(() => {
                    setIsConnected(true);
                    connection.invoke("JoinChatRoom", deviceId);
                });
            } catch (error) {
                setIsConnected(false);
                console.error("❌ SignalR Connection Error:", error);
            }
        };

        startConnection();

        setSendMessage(async (method: string, ...args: any[]) => {
            if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
                await connectionRef.current.invoke(method, ...args);
            }
        });

        return () => {
            isCancelled = true;
            connection.stop();
        };
    }, [deviceId, setIsConnected, setSendMessage, addMessage]);


}