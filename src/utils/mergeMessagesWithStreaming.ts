// Utility function to merge regular messages with streaming messages
export const mergeMessagesWithStreaming = (
    regularMessages: any[],
    signalRMessages: any[],
    streamingMessages: any[],
    pendingMessages: any[],
    pendingImages: any[],
    pendingFiles: any[]
) => {
    const allMessages = [...regularMessages, ...signalRMessages];

    // Convert streaming messages to message format
    const convertedStreamingMessages = streamingMessages.map((streamMsg: any) => ({
        id: streamMsg.messageCode,
        text: streamMsg.completeText,
        createdAt: streamMsg.startTime,
        isStreaming: streamMsg.isStreaming,
        isStreamComplete: streamMsg.isComplete,
        hasStreamError: streamMsg.hasError,
        streamErrorMessage: streamMsg.errorMessage,
        chunks: streamMsg.chunks,
        type: 'stream',
        // Add visual indicators for streaming
        _isStreamingMessage: true,
        _streamStatus: streamMsg.isStreaming ? 'streaming' :
            streamMsg.hasError ? 'error' : 'complete'
    }));

    // Merge all message types
    const merged = [
        ...allMessages,
        ...convertedStreamingMessages,
        ...pendingMessages,
        ...pendingImages,
        ...pendingFiles
    ];

    // Sort by timestamp
    return merged.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.startTime || 0).getTime();
        const timeB = new Date(b.createdAt || b.startTime || 0).getTime();
        return timeA - timeB;
    });
};
