/**
 * Mobile SignalR Configuration Utility
 * Provides optimized configurations for mobile/Capacitor environments
 */

import * as signalR from "@microsoft/signalr";

export interface MobileSignalRConfig {
    transport: signalR.HttpTransportType;
    timeout: number;
    withCredentials: boolean;
    skipNegotiation: boolean;
    headers: Record<string, string>;
    automaticReconnect: number[];
    enableReconnect: boolean;
    logLevel: signalR.LogLevel;
    fallbackTransports?: signalR.HttpTransportType[]; // Thêm fallback transports
}

export const getMobileSignalRConfig = (): MobileSignalRConfig => {
    const isCapacitor = !!(window as any).Capacitor;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || isCapacitor;

    if (isCapacitor) {
        return {
            transport: signalR.HttpTransportType.LongPolling, // Most reliable for mobile
            timeout: 600000, // 60 seconds for slower mobile networks
            withCredentials: false, // Avoid CORS issues
            skipNegotiation: false, // Keep negotiation for proper setup
            headers: {
                'Content-Type': 'application/json',
            },
            automaticReconnect: [0, 2000, 10000, 30000, 60000], // Aggressive reconnection
            enableReconnect: true,
            logLevel: signalR.LogLevel.Information, // More detailed logging for debugging
            fallbackTransports: [
                signalR.HttpTransportType.ServerSentEvents,
                signalR.HttpTransportType.LongPolling
            ]
        };
    } else if (isMobile) {
        // Configuration for mobile browsers
        return {
            transport: signalR.HttpTransportType.LongPolling,
            timeout: 30000,
            withCredentials: false,
            skipNegotiation: false,
            headers: {
                'Content-Type': 'application/json',
            },
            automaticReconnect: [0, 2000, 10000, 30000],
            enableReconnect: true,
            logLevel: signalR.LogLevel.Warning,
            fallbackTransports: [
                signalR.HttpTransportType.ServerSentEvents,
                signalR.HttpTransportType.LongPolling
            ]
        };
    } else {
        // Desktop/web configuration
        return {
            transport: signalR.HttpTransportType.WebSockets,
            timeout: 30000,
            withCredentials: false,
            skipNegotiation: false,
            headers: {},
            automaticReconnect: [0, 2000, 10000],
            enableReconnect: true,
            logLevel: signalR.LogLevel.Warning,
            fallbackTransports: [
                signalR.HttpTransportType.ServerSentEvents,
                signalR.HttpTransportType.LongPolling
            ]
        };
    }
};

export const createMobileOptimizedConnection = (
    hubUrl: string,
    accessTokenFactory: () => string,
    transportOverride?: signalR.HttpTransportType
): signalR.HubConnection => {
    const config = getMobileSignalRConfig();
    const transport = transportOverride || config.transport;
    
    const builder = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
            accessTokenFactory,
            transport,
            timeout: config.timeout,
            withCredentials: config.withCredentials, // Sử dụng config.withCredentials thay vì hardcode true
            skipNegotiation: config.skipNegotiation,
            headers: config.headers
        })
        .configureLogging(config.logLevel);

    if (config.enableReconnect) {
        builder.withAutomaticReconnect(config.automaticReconnect);
    }

    return builder.build();
};

// Thêm helper function để thử các transport khác nhau khi gặp lỗi
export const createConnectionWithFallback = async (
    hubUrl: string,
    accessTokenFactory: () => string
): Promise<signalR.HubConnection> => {
    const config = getMobileSignalRConfig();
    const transportsToTry = [config.transport, ...(config.fallbackTransports || [])];
    
    let lastError: Error | null = null;
    
    for (const transport of transportsToTry) {
        try {
            console.log(`🔄 Thử kết nối với transport: ${signalR.HttpTransportType[transport]}`);
            
            const connection = createMobileOptimizedConnection(hubUrl, accessTokenFactory, transport);
            
            // Test connection
            await connection.start();
            console.log(`✅ Kết nối thành công với transport: ${signalR.HttpTransportType[transport]}`);
            
            return connection;
        } catch (error: any) {
            lastError = error;
            console.warn(`❌ Transport ${signalR.HttpTransportType[transport]} failed:`, error.message);
            
            // Specific error handling
            if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
                console.warn('🚫 CORS error detected, trying next transport...');
            } else if (error.message.includes('504') || error.message.includes('Gateway Timeout')) {
                console.warn('⏰ Gateway timeout detected, trying next transport...');
            }
        }
    }
    
    // Nếu tất cả transport đều fail
    console.error('🚨 Tất cả transport options đều thất bại');
    throw lastError || new Error('Không thể kết nối với bất kỳ transport nào');
};

