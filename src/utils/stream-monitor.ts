// Stream Performance Monitor & Debug Utility
export interface StreamMetrics {
    messageCode: string;
    chatCode: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    chunkCount: number;
    totalBytes: number;
    avgChunkSize: number;
    throughput?: number; // chunks per second
    byteThroughput?: number; // bytes per second
    status: 'active' | 'completed' | 'error';
    errorMessage?: string;
}

export interface ConnectionMetrics {
    connectionAttempts: number;
    successfulConnections: number;
    failedConnections: number;
    totalDowntime: number;
    avgReconnectionTime: number;
    lastConnectionTime: number;
    connectionUptime: number;
}

class StreamMonitor {
    private metrics: Map<string, StreamMetrics> = new Map();
    private connectionMetrics: ConnectionMetrics = {
        connectionAttempts: 0,
        successfulConnections: 0,
        failedConnections: 0,
        totalDowntime: 0,
        avgReconnectionTime: 0,
        lastConnectionTime: 0,
        connectionUptime: 0
    };
    private performanceLogs: Array<{
        timestamp: number;
        event: string;
        data: any;
    }> = [];

    // Initialize stream tracking
    startStream(messageCode: string, chatCode: string): void {
        const metrics: StreamMetrics = {
            messageCode,
            chatCode,
            startTime: Date.now(),
            chunkCount: 0,
            totalBytes: 0,
            avgChunkSize: 0,
            status: 'active'
        };
        
        this.metrics.set(messageCode, metrics);
        this.logEvent('stream_started', { messageCode, chatCode });
    }

    // Update stream with new chunk
    addChunk(messageCode: string, chunk: string): void {
        const metrics = this.metrics.get(messageCode);
        if (!metrics) return;

        metrics.chunkCount++;
        metrics.totalBytes += new Blob([chunk]).size;
        metrics.avgChunkSize = metrics.totalBytes / metrics.chunkCount;

        // Calculate throughput
        const duration = (Date.now() - metrics.startTime) / 1000;
        if (duration > 0) {
            metrics.throughput = metrics.chunkCount / duration;
            metrics.byteThroughput = metrics.totalBytes / duration;
        }

        this.metrics.set(messageCode, metrics);
    }

    // Complete stream
    completeStream(messageCode: string): StreamMetrics | undefined {
        const metrics = this.metrics.get(messageCode);
        if (!metrics) return;

        metrics.endTime = Date.now();
        metrics.duration = metrics.endTime - metrics.startTime;
        metrics.status = 'completed';

        // Final throughput calculation
        const durationSec = metrics.duration / 1000;
        if (durationSec > 0) {
            metrics.throughput = metrics.chunkCount / durationSec;
            metrics.byteThroughput = metrics.totalBytes / durationSec;
        }

        this.logEvent('stream_completed', {
            messageCode,
            duration: metrics.duration,
            chunkCount: metrics.chunkCount,
            throughput: metrics.throughput
        });

        return metrics;
    }

    // Mark stream as error
    errorStream(messageCode: string, errorMessage: string): void {
        const metrics = this.metrics.get(messageCode);
        if (!metrics) return;

        metrics.endTime = Date.now();
        metrics.duration = metrics.endTime - metrics.startTime;
        metrics.status = 'error';
        metrics.errorMessage = errorMessage;

        this.logEvent('stream_error', {
            messageCode,
            errorMessage,
            duration: metrics.duration
        });
    }

    // Connection monitoring
    recordConnectionAttempt(): void {
        this.connectionMetrics.connectionAttempts++;
        this.logEvent('connection_attempt', { attempt: this.connectionMetrics.connectionAttempts });
    }

    recordConnectionSuccess(): void {
        this.connectionMetrics.successfulConnections++;
        this.connectionMetrics.lastConnectionTime = Date.now();
        
        // Calculate uptime
        if (this.connectionMetrics.successfulConnections > 1) {
            const reconnectionTime = Date.now() - this.connectionMetrics.lastConnectionTime;
            this.connectionMetrics.avgReconnectionTime = 
                (this.connectionMetrics.avgReconnectionTime + reconnectionTime) / 2;
        }

        this.logEvent('connection_success', {
            totalAttempts: this.connectionMetrics.connectionAttempts,
            successRate: this.getConnectionSuccessRate()
        });
    }

    recordConnectionFailure(): void {
        this.connectionMetrics.failedConnections++;
        this.logEvent('connection_failure', {
            failures: this.connectionMetrics.failedConnections,
            successRate: this.getConnectionSuccessRate()
        });
    }

    // Analytics methods
    getStreamMetrics(messageCode: string): StreamMetrics | undefined {
        return this.metrics.get(messageCode);
    }

    getAllStreamMetrics(): StreamMetrics[] {
        return Array.from(this.metrics.values());
    }

    getActiveStreams(): StreamMetrics[] {
        return this.getAllStreamMetrics().filter(m => m.status === 'active');
    }

    getCompletedStreams(): StreamMetrics[] {
        return this.getAllStreamMetrics().filter(m => m.status === 'completed');
    }

    getErrorStreams(): StreamMetrics[] {
        return this.getAllStreamMetrics().filter(m => m.status === 'error');
    }

    getConnectionMetrics(): ConnectionMetrics {
        return { ...this.connectionMetrics };
    }

    getConnectionSuccessRate(): number {
        if (this.connectionMetrics.connectionAttempts === 0) return 100;
        return (this.connectionMetrics.successfulConnections / this.connectionMetrics.connectionAttempts) * 100;
    }

    // Performance analytics
    getPerformanceReport(): {
        streams: {
            total: number;
            active: number;
            completed: number;
            errors: number;
            avgDuration: number;
            avgThroughput: number;
            avgByteThroughput: number;
        };
        connection: ConnectionMetrics & {
            successRate: number;
        };
        issues: string[];
    } {
        const allStreams = this.getAllStreamMetrics();
        const completedStreams = this.getCompletedStreams();
        
        const avgDuration = completedStreams.length > 0 
            ? completedStreams.reduce((sum, s) => sum + (s.duration || 0), 0) / completedStreams.length
            : 0;
            
        const avgThroughput = completedStreams.length > 0
            ? completedStreams.reduce((sum, s) => sum + (s.throughput || 0), 0) / completedStreams.length
            : 0;
            
        const avgByteThroughput = completedStreams.length > 0
            ? completedStreams.reduce((sum, s) => sum + (s.byteThroughput || 0), 0) / completedStreams.length
            : 0;

        // Identify potential issues
        const issues: string[] = [];
        
        if (this.getConnectionSuccessRate() < 90) {
            issues.push('Low connection success rate (< 90%)');
        }
        
        if (avgThroughput < 1) {
            issues.push('Low stream throughput (< 1 chunk/sec)');
        }
        
        if (this.getErrorStreams().length / allStreams.length > 0.1) {
            issues.push('High stream error rate (> 10%)');
        }
        
        if (this.getActiveStreams().some(s => Date.now() - s.startTime > 60000)) {
            issues.push('Long-running streams detected (> 60s)');
        }

        return {
            streams: {
                total: allStreams.length,
                active: this.getActiveStreams().length,
                completed: this.getCompletedStreams().length,
                errors: this.getErrorStreams().length,
                avgDuration,
                avgThroughput,
                avgByteThroughput
            },
            connection: {
                ...this.connectionMetrics,
                successRate: this.getConnectionSuccessRate()
            },
            issues
        };
    }

    // Debug utilities
    exportLogs(): string {
        return JSON.stringify({
            metrics: Array.from(this.metrics.entries()),
            connectionMetrics: this.connectionMetrics,
            performanceLogs: this.performanceLogs.slice(-100) // Last 100 events
        }, null, 2);
    }

    clearOldMetrics(olderThanMs: number = 300000): void { // Default 5 minutes
        const cutoff = Date.now() - olderThanMs;
        
        for (const [messageCode, metrics] of this.metrics.entries()) {
            if (metrics.endTime && metrics.endTime < cutoff) {
                this.metrics.delete(messageCode);
            }
        }
        
        // Clear old logs
        this.performanceLogs = this.performanceLogs.filter(
            log => log.timestamp > cutoff
        );
    }

    private logEvent(event: string, data: any): void {
        this.performanceLogs.push({
            timestamp: Date.now(),
            event,
            data
        });
        
        // Keep only last 1000 events
        if (this.performanceLogs.length > 1000) {
            this.performanceLogs = this.performanceLogs.slice(-1000);
        }
        
        // Console log for debugging
        console.log(`🔍 StreamMonitor [${event}]:`, data);
    }

    // Real-time monitoring
    startPerformanceMonitoring(intervalMs: number = 10000): () => void {
        const interval = setInterval(() => {
            const report = this.getPerformanceReport();
            
            if (report.issues.length > 0) {
                console.warn('⚠️ Stream Performance Issues Detected:', report.issues);
            }
            
            console.log('📊 Stream Performance Report:', {
                streams: report.streams,
                connectionSuccessRate: report.connection.successRate,
                issues: report.issues.length
            });
        }, intervalMs);

        return () => clearInterval(interval);
    }
}

// Singleton instance
export const streamMonitor = new StreamMonitor();

// Hook để integrate với React components
export const useStreamMonitor = () => {
    return {
        monitor: streamMonitor,
        getReport: () => streamMonitor.getPerformanceReport(),
        exportLogs: () => streamMonitor.exportLogs(),
        clearOldMetrics: (ms?: number) => streamMonitor.clearOldMetrics(ms)
    };
};