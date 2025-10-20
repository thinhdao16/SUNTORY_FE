/**
 * SignalR Connection Test Utility
 * Tests basic connectivity before attempting SignalR connection
 */

export interface ConnectionTestResult {
    success: boolean;
    message: string;
    details?: any;
    suggestions?: string[];
    errorType?: 'CORS' | 'TIMEOUT' | 'NETWORK' | 'AUTH' | 'UNKNOWN';
}

export const testSignalREndpoint = async (baseUrl: string): Promise<ConnectionTestResult> => {
    try {
        // Test basic HTTP connectivity to the negotiate endpoint
        const negotiateUrl = `${baseUrl}/chatHub/negotiate`;
        
        // Add timeout và CORS specific checks
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(negotiateUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            },
            signal: controller.signal,
            mode: 'cors', // Explicitly request CORS
            credentials: 'omit' // Avoid credentials to prevent CORS issues
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            return {
                success: true,
                message: 'SignalR negotiate endpoint is reachable',
                details: data
            };
        } else if (response.status === 504) {
            return {
                success: false,
                message: `Gateway Timeout (504): Server quá chậm phản hồi`,
                errorType: 'TIMEOUT',
                suggestions: [
                    'Server có thể đang overloaded',
                    'Network latency cao',
                    'Thử lại sau vài phút',
                    'Kiểm tra server health status'
                ]
            };
        } else if (response.status === 401 || response.status === 403) {
            return {
                success: false,
                message: `Authentication Error (${response.status}): ${response.statusText}`,
                errorType: 'AUTH',
                suggestions: [
                    'Kiểm tra authentication token',
                    'Token có thể đã expired',
                    'Verify user permissions',
                    'Try login lại'
                ]
            };
        } else {
            return {
                success: false,
                message: `HTTP ${response.status}: ${response.statusText}`,
                errorType: 'UNKNOWN',
                suggestions: [
                    'Check server is running',
                    'Verify CORS configuration',
                    'Check authentication token',
                    'Ensure endpoint URL is correct'
                ]
            };
        }
    } catch (error: any) {
        const suggestions = [];
        let errorType: ConnectionTestResult['errorType'] = 'UNKNOWN';

        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            errorType = 'CORS';
            suggestions.push(
                '🚫 CORS Policy Error detected',
                'Server CORS configuration cần allow origin: ' + window.location.origin,
                'Kiểm tra server Access-Control-Allow-Origin headers',
                'Nếu đang dev: thử disable web security hoặc use proxy'
            );
        } else if (error.name === 'AbortError') {
            errorType = 'TIMEOUT';
            suggestions.push(
                '⏰ Request timeout (>10s)',
                'Server may be slow to respond',
                'Network connectivity issues',
                'Try again with better network connection'
            );
        } else if (error.message.includes('ERR_NETWORK')) {
            errorType = 'NETWORK';
            suggestions.push(
                '🌐 Network error - check internet connectivity',
                'Server may be unreachable',
                'Firewall có thể block request',
                'Verify server URL đúng'
            );
        } else {
            suggestions.push(
                'Unknown error occurred',
                'Check browser console for details',
                'Try manual retry'
            );
        }

        return {
            success: false,
            message: `Connection test failed: ${error.message}`,
            details: error,
            suggestions,
            errorType
        };
    }
};

// Thêm CORS specific test
export const testCORSPolicy = async (baseUrl: string): Promise<ConnectionTestResult> => {
    try {
        // Simple OPTIONS request để test CORS preflight
        const response = await fetch(`${baseUrl}/chatHub/negotiate`, {
            method: 'OPTIONS',
            headers: {
                'Origin': window.location.origin,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type,Authorization',
            },
        });

        const corsHeaders = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        };

        if (response.ok) {
            return {
                success: true,
                message: 'CORS preflight passed',
                details: corsHeaders
            };
        } else {
            return {
                success: false,
                message: `CORS preflight failed: ${response.status}`,
                errorType: 'CORS',
                details: corsHeaders,
                suggestions: [
                    'Server chưa configure CORS properly',
                    `Cần allow origin: ${window.location.origin}`,
                    'Enable Access-Control-Allow-Methods: POST',
                    'Enable Access-Control-Allow-Headers: Content-Type,Authorization'
                ]
            };
        }
    } catch (error: any) {
        return {
            success: false,
            message: `CORS test failed: ${error.message}`,
            errorType: 'CORS',
            suggestions: [
                'CORS preflight request blocked',
                'Server CORS configuration có vấn đề',
                'Thử fallback transport (LongPolling)'
            ]
        };
    }
};

export const runPreConnectionTests = async (baseUrl: string): Promise<void> => {
    console.log('🔍 Running pre-connection diagnostics...');

    // Test 1: Basic endpoint connectivity
    const endpointTest = await testSignalREndpoint(baseUrl);
    
    // Test 2: CORS policy test
    const corsTest = await testCORSPolicy(baseUrl);

    // Test 3: Token availability
    const token = localStorage.getItem('token');

    // Enhanced reporting
    console.log('📊 Pre-connection Test Results:');
    console.log(`  ✅ Endpoint reachable: ${endpointTest.success ? 'YES' : 'NO'}`);
    console.log(`  ✅ CORS policy OK: ${corsTest.success ? 'YES' : 'NO'}`);
    console.log(`  ✅ Auth token available: ${token ? 'YES' : 'NO'}`);

    if (!endpointTest.success) {
        console.warn('⚠️ Endpoint connectivity issues:');
        console.warn(`  Error Type: ${endpointTest.errorType}`);
        endpointTest.suggestions?.forEach(suggestion => {
            console.warn(`  • ${suggestion}`);
        });
    }

    if (!corsTest.success) {
        console.warn('⚠️ CORS policy issues detected:');
        corsTest.suggestions?.forEach(suggestion => {
            console.warn(`  • ${suggestion}`);
        });
    }

    if (!token) {
        console.warn('⚠️ No authentication token found');
        console.warn('  • User may need to login again');
        console.warn('  • Check localStorage for token');
    }

    // Overall assessment
    if (!endpointTest.success || !corsTest.success) {
        console.warn('🚨 Pre-connection tests detected potential issues');
        console.warn('   SignalR connection may fail or be unstable');
        console.warn('   Consider using fallback transport options');
    } else {
        console.log('✅ Pre-connection tests passed - connection should be stable');
    }
};
