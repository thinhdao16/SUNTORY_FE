/**
 * SignalR Diagnostics Utility
 * Helps diagnose common SignalR connection issues on mobile devices
 */

export interface SignalRDiagnostics {
    isCapacitor: boolean;
    isMobile: boolean;
    platform: string;
    networkStatus: string;
    suggestedTransport: string;
    troubleshootingTips: string[];
}

export const getSignalRDiagnostics = (): SignalRDiagnostics => {
    const isCapacitor = !!(window as any).Capacitor;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || isCapacitor;

    let platform = 'web';
    if (isCapacitor) {
        platform = 'capacitor';
    } else if (isMobile) {
        platform = 'mobile-web';
    }

    const networkStatus = navigator.onLine ? 'online' : 'offline';

    const suggestedTransport = isMobile ? 'LongPolling' : 'WebSockets';

    const troubleshootingTips: string[] = [];

    if (isCapacitor) {
        troubleshootingTips.push(
            'Ensure allowNavigation includes your SignalR server domain in capacitor.config.ts',
            'Consider using androidScheme: "https" for HTTPS compatibility',
            'Check that server supports CORS for your app domain'
        );
    }

    if (isMobile && !isCapacitor) {
        troubleshootingTips.push(
            'Mobile web browsers may have WebSocket limitations',
            'LongPolling transport is more reliable on mobile networks',
            'Ensure HTTPS is used for secure connections'
        );
    }

    if (!navigator.onLine) {
        troubleshootingTips.push(
            'Device appears to be offline',
            'Check network connectivity'
        );
    }

    troubleshootingTips.push(
        'Verify server SignalR hub is running and accessible',
        'Check authentication token validity',
        'Review server CORS configuration'
    );

    return {
        isCapacitor,
        isMobile,
        platform,
        networkStatus,
        suggestedTransport,
        troubleshootingTips
    };
};

export const logSignalRDiagnostics = (): void => {
    const diagnostics = getSignalRDiagnostics();

    console.group('🔍 SignalR Diagnostics');
    console.log('Platform:', diagnostics.platform);
    console.log('Is Capacitor:', diagnostics.isCapacitor);
    console.log('Is Mobile:', diagnostics.isMobile);
    console.log('Network Status:', diagnostics.networkStatus);
    console.log('Suggested Transport:', diagnostics.suggestedTransport);
    console.log('Troubleshooting Tips:');
    diagnostics.troubleshootingTips.forEach((tip, index) => {
        console.log(`  ${index + 1}. ${tip}`);
    });
    console.groupEnd();
};
