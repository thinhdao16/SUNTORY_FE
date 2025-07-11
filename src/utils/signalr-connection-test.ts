/**
 * SignalR Connection Test Utility
 * Tests basic connectivity before attempting SignalR connection
 */

export interface ConnectionTestResult {
    success: boolean;
    message: string;
    details?: any;
    suggestions?: string[];
}

export const testSignalREndpoint = async (baseUrl: string): Promise<ConnectionTestResult> => {
    try {
        // Test basic HTTP connectivity to the negotiate endpoint
        const negotiateUrl = `${baseUrl}/chatHub/negotiate`;

        console.log(`🔍 Testing SignalR endpoint: ${negotiateUrl}`);

        const response = await fetch(negotiateUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            },
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (response.ok) {
            const data = await response.json();
            return {
                success: true,
                message: 'SignalR negotiate endpoint is reachable',
                details: data
            };
        } else {
            return {
                success: false,
                message: `HTTP ${response.status}: ${response.statusText}`,
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

        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            suggestions.push(
                'Network error - check internet connectivity',
                'Server may be unreachable',
                'CORS policy may be blocking the request'
            );
        } else if (error.name === 'AbortError') {
            suggestions.push(
                'Request timed out',
                'Server may be slow to respond',
                'Network connectivity issues'
            );
        } else {
            suggestions.push(
                'Unknown error occurred',
                'Check browser console for details'
            );
        }

        return {
            success: false,
            message: `Connection test failed: ${error.message}`,
            details: error,
            suggestions
        };
    }
};

export const runPreConnectionTests = async (baseUrl: string): Promise<void> => {
    console.group('🧪 Pre-Connection Tests');

    // Test 1: Basic endpoint connectivity
    const endpointTest = await testSignalREndpoint(baseUrl);
    console.log('Endpoint Test:', endpointTest);

    // Test 2: Network status
    console.log('Network Online:', navigator.onLine);

    // Test 3: Token availability
    const token = localStorage.getItem('token');
    console.log('Auth Token:', token ? `Present (${token.substring(0, 10)}...)` : 'Missing');

    console.groupEnd();

    if (!endpointTest.success) {
        console.warn('⚠️ Pre-connection tests detected issues:');
        endpointTest.suggestions?.forEach(suggestion => {
            console.warn(`  • ${suggestion}`);
        });
    }
};
