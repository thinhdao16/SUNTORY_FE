import React, { useEffect, useState } from 'react';
import { useSignalRStream } from '@/hooks/useSignalRStream';
import { StreamChunk } from '@/store/zustand/signalr-stream-store';

const StreamDebugger: React.FC = () => {
    const [deviceId] = useState(() => `debug-${Date.now()}`);
    const [testMessage, setTestMessage] = useState('Hello, how are you today?');
    const [testChatCode] = useState(() => `debug-chat-${Date.now()}`);

    const {
        isConnected,
        connectionId,
        sendStreamMessage,
        getStreamMessagesByChatCode,
        getActiveStreams,
        manualRetry,
        getConnectionStats,
        logStreamStats,
        streamStats
    } = useSignalRStream(deviceId, {
        autoReconnect: true,
        logLevel: 0 // Information level for detailed logs
    });

    const connectionStats = getConnectionStats();
    const chatStreams = getStreamMessagesByChatCode(testChatCode);
    const activeStreams = getActiveStreams();

    useEffect(() => {
        // Log stream stats every 5 seconds when connected
        if (isConnected) {
            const interval = setInterval(logStreamStats, 5000);
            return () => clearInterval(interval);
        }
    }, [isConnected, logStreamStats]);

    const handleSendMessage = async () => {
        if (!isConnected) {
            console.warn('Not connected to SignalR');
            return;
        }

        try {
            console.log('🚀 Sending test message:', testMessage);
            const messageCode = await sendStreamMessage(testChatCode, testMessage);
            console.log('✅ Message sent with code:', messageCode);
        } catch (error) {
            console.error('❌ Failed to send message:', error);
        }
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">SignalR Stream Debugger</h1>

                {/* Connection Status */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <h2 className="text-lg font-semibold mb-3">Connection Status</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                            </span>
                            {connectionId && (
                                <p className="text-sm text-gray-600 mt-1">
                                    ID: {connectionId.substring(0, 8)}...
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm">Failures: {connectionStats.failures}</p>
                            <p className="text-sm">
                                Last Attempt: {connectionStats.lastAttempt?.toLocaleTimeString() || 'None'}
                            </p>
                            <p className="text-sm">
                                Retrying: {connectionStats.isRetrying ? 'Yes' : 'No'}
                            </p>
                        </div>
                    </div>
                    {!isConnected && (
                        <button
                            onClick={manualRetry}
                            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Manual Retry
                        </button>
                    )}
                </div>

                {/* Stream Statistics */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <h2 className="text-lg font-semibold mb-3">Stream Statistics</h2>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{streamStats.total}</div>
                            <div className="text-sm text-gray-600">Total</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{streamStats.active}</div>
                            <div className="text-sm text-gray-600">Active</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-600">{streamStats.completed}</div>
                            <div className="text-sm text-gray-600">Completed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{streamStats.errors}</div>
                            <div className="text-sm text-gray-600">Errors</div>
                        </div>
                    </div>
                    <button
                        onClick={logStreamStats}
                        className="mt-3 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Log Detailed Stats
                    </button>
                </div>

                {/* Test Message */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <h2 className="text-lg font-semibold mb-3">Send Test Message</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Message</label>
                            <textarea
                                value={testMessage}
                                onChange={(e) => setTestMessage(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                rows={3}
                                placeholder="Enter test message..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Chat Code</label>
                            <input
                                type="text"
                                value={testChatCode}
                                readOnly
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                            />
                        </div>
                        <button
                            onClick={handleSendMessage}
                            disabled={!isConnected || !testMessage.trim()}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Send Stream Message
                        </button>
                    </div>
                </div>

                {/* Active Streams */}
                {activeStreams.length > 0 && (
                    <div className="bg-white p-4 rounded-lg shadow mb-6">
                        <h2 className="text-lg font-semibold mb-3">Active Streams ({activeStreams.length})</h2>
                        <div className="space-y-2">
                            {activeStreams.map(stream => (
                                <div key={stream.messageCode} className="border border-gray-200 rounded p-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                            {stream.messageCode}
                                        </code>
                                        <span className="text-xs text-gray-500">
                                            {stream.chunks.length} chunks
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-700">
                                        <strong>Complete Text:</strong> {stream.completeText.substring(0, 200)}
                                        {stream.completeText.length > 200 && '...'}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Started: {new Date(stream.startTime).toLocaleTimeString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Chat Streams */}
                {chatStreams.length > 0 && (
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-lg font-semibold mb-3">Chat Streams ({chatStreams.length})</h2>
                        <div className="space-y-3">
                            {chatStreams.map(stream => (
                                <div key={stream.messageCode} className="border border-gray-200 rounded p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                            {stream.messageCode}
                                        </code>
                                        <div className="flex space-x-2">
                                            {stream.isStreaming && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    🔄 Streaming
                                                </span>
                                            )}
                                            {stream.isComplete && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    ✅ Complete
                                                </span>
                                            )}
                                            {stream.hasError && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    ❌ Error
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div>
                                            <strong className="text-sm">Complete Text ({stream.completeText.length} chars):</strong>
                                            <div className="bg-gray-50 p-2 rounded text-sm mt-1">
                                                {stream.completeText || '(empty)'}
                                            </div>
                                        </div>

                                        <div>
                                            <strong className="text-sm">Chunks ({stream.chunks.length}):</strong>
                                            <div className="space-y-1 mt-1">
                                                {stream.chunks.map((chunk: StreamChunk, index: number) => (
                                                    <div key={index} className="bg-yellow-50 p-2 rounded text-xs">
                                                        <span className="font-mono">#{index + 1}:</span> "{chunk.chunk}"
                                                        <span className="text-gray-500 ml-2">
                                                            at {new Date(chunk.timestamp).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {stream.hasError && stream.errorMessage && (
                                            <div className="bg-red-50 border border-red-200 rounded p-2">
                                                <strong className="text-sm text-red-800">Error:</strong>
                                                <div className="text-sm text-red-700">{stream.errorMessage}</div>
                                            </div>
                                        )}

                                        <div className="text-xs text-gray-500">
                                            Started: {new Date(stream.startTime).toLocaleTimeString()}
                                            {stream.endTime && (
                                                <span> • Ended: {new Date(stream.endTime).toLocaleTimeString()}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StreamDebugger;
