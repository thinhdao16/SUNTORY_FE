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
}

export const getMobileSignalRConfig = (): MobileSignalRConfig => {
    const isCapacitor = !!(window as any).Capacitor;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || isCapacitor;

    if (isCapacitor) {
        // Optimized configuration for Capacitor apps
        return {
            transport: signalR.HttpTransportType.LongPolling, // Most reliable for mobile
            timeout: 60000, // 60 seconds for slower mobile networks
            withCredentials: false, // Avoid CORS issues
            skipNegotiation: false, // Keep negotiation for proper setup
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            automaticReconnect: [0, 2000, 10000, 30000, 60000], // Aggressive reconnection
            enableReconnect: true,
            logLevel: signalR.LogLevel.Information // More detailed logging for debugging
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
            logLevel: signalR.LogLevel.Warning
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
            logLevel: signalR.LogLevel.Warning
        };
    }
};

export const createMobileOptimizedConnection = (
    hubUrl: string,
    accessTokenFactory: () => string
): signalR.HubConnection => {
    const config = getMobileSignalRConfig();

    console.log('🔧 Creating SignalR connection with mobile-optimized config:', {
        transport: getTransportName(config.transport),
        timeout: config.timeout,
        logLevel: getLogLevelName(config.logLevel)
    });

    const builder = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
            accessTokenFactory,
            transport: config.transport,
            timeout: config.timeout,
            withCredentials: true,
            skipNegotiation: config.skipNegotiation,
            headers: config.headers
        })
        .configureLogging(config.logLevel);

    if (config.enableReconnect) {
        builder.withAutomaticReconnect(config.automaticReconnect);
    }

    return builder.build();
};

const getTransportName = (transport: signalR.HttpTransportType): string => {
    switch (transport) {
        case signalR.HttpTransportType.WebSockets:
            return 'WebSockets';
        case signalR.HttpTransportType.ServerSentEvents:
            return 'ServerSentEvents';
        case signalR.HttpTransportType.LongPolling:
            return 'LongPolling';
        default:
            return 'Unknown';
    }
};

const getLogLevelName = (logLevel: signalR.LogLevel): string => {
    switch (logLevel) {
        case signalR.LogLevel.Trace:
            return 'Trace';
        case signalR.LogLevel.Debug:
            return 'Debug';
        case signalR.LogLevel.Information:
            return 'Information';
        case signalR.LogLevel.Warning:
            return 'Warning';
        case signalR.LogLevel.Error:
            return 'Error';
        case signalR.LogLevel.Critical:
            return 'Critical';
        case signalR.LogLevel.None:
            return 'None';
        default:
            return 'Unknown';
    }
};
