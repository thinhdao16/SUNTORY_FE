import { useEffect, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import ENV from "@/config/env";
import { useMenuTranslationStore } from "@/store/zustand/menuTranslationStore";

export function useMenuSignalR(menuId: string) {
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const { setIsConnected, setFoodSuccess, foodSuccess, setFoodFailed, foodFailed } = useMenuTranslationStore();
    const isConnectingRef = useRef(false);

    // Tách logic xử lý message ra thành callback riêng
    const handleReceive = useCallback((msg: any) => {
        if (msg?.success === true) {
            const newCount = foodSuccess + 1;
            setFoodSuccess(newCount);
            console.log("🍽️ FoodSuccess count: ", foodSuccess, "→", newCount);
        }
        else {
            const newCount = foodFailed + 1;
            setFoodFailed(newCount);
            console.log("🍽️ FoodFailed count: ", foodFailed, "→", newCount);
        }
    }, [foodSuccess, setFoodSuccess, foodFailed, setFoodFailed]);

    // Tách logic kết nối ra thành callback riêng
    const startConnection = useCallback(async () => {
        if (!connectionRef.current || isConnectingRef.current) return;
        
        try {
            isConnectingRef.current = true;
            
            if (connectionRef.current.state === signalR.HubConnectionState.Connected) {
                console.log("🔄 Menu SignalR already connected");
                return;
            }

            await connectionRef.current.start();
            await connectionRef.current.invoke("JoinFoodImageGroup", menuId);
            console.log("✅ Menu SignalR connected successfully");
            setIsConnected(true);
        } catch (err) {
            console.error("❌ Menu SignalR connection error:", err);
            setIsConnected(false);
        } finally {
            isConnectingRef.current = false;
        }
    }, [menuId, setIsConnected]);

    // Tách logic join group ra thành callback riêng
    const joinGroup = useCallback(async () => {
        if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
            try {
                await connectionRef.current.invoke("JoinFoodImageGroup", menuId);
                console.log("👥 Joined food image group:", menuId);
            } catch (err) {
                console.error("❌ Failed to join group:", err);
            }
        }
    }, [menuId]);

    useEffect(() => {
        if (Number(menuId) <= 0) return;

        // Tạo connection mới
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${ENV.BE}/menuTranslationHub`, {
                accessTokenFactory: () => localStorage.getItem("token") || "",
                transport: signalR.HttpTransportType.WebSockets
            })
            .withAutomaticReconnect([0, 2000, 10000, 30000])
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        connectionRef.current = connection;

        // Thiết lập event handlers
        connection.onreconnecting(() => {
            console.log("🔄 Menu SignalR reconnecting...");
            setIsConnected(false);
        });

        connection.onreconnected(() => {
            console.log("✅ Menu SignalR reconnected");
            joinGroup(); // Join lại group sau khi reconnect
            setIsConnected(true);
        });

        connection.onclose(() => {
            console.log("❌ Menu SignalR connection closed");
            setIsConnected(false);
        });

        // Đăng ký event handler
        connection.on("FoodImageGenerated", handleReceive);

        // Bắt đầu kết nối
        startConnection();

        // Cleanup function
        return () => {
            console.log("🧹 Cleaning up Menu SignalR");
            
            // Remove event handlers
            connection.off("FoodImageGenerated", handleReceive);
            
            // Stop connection
            if (connection.state !== signalR.HubConnectionState.Disconnected) {
                connection.stop().catch((err) => {
                    console.error("❌ Error stopping connection:", err);
                });
            }
            
            // Reset refs
            connectionRef.current = null;
            isConnectingRef.current = false;
        };
    }, [menuId, startConnection, joinGroup, handleReceive, setIsConnected]);

    // Return connection state để component có thể sử dụng
    return {
        isConnected: connectionRef.current?.state === signalR.HubConnectionState.Connected,
        connection: connectionRef.current
    };
}