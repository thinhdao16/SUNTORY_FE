import { create } from "zustand";

export interface StreamChunk {
    chatCode: string;
    messageCode: string;
    chunk: string;
    completeText: string;
    timestamp: string;
}

export interface StreamEvent {
    chatCode: string;
    messageCode: string;
    timestamp: string;
    errorMessage?: string;
}

export interface StreamMessage {
    messageCode: string;
    chatCode: string;
    chunks: StreamChunk[];
    isStreaming: boolean;
    isComplete: boolean;
    hasError: boolean;
    errorMessage?: string;
    completeText: string;
    startTime: string;
    endTime?: string;
}

interface SignalRStreamStore {
    // Connection status
    isConnected: boolean;
    connectionId?: string;

    // Stream messages by messageCode
    streamMessages: Record<string, StreamMessage>;

    // Actions
    setConnection: (isConnected: boolean, connectionId?: string) => void;

    // Stream chunk handling
    addStreamChunk: (chunk: StreamChunk) => void;

    // Stream completion
    completeStream: (event: StreamEvent) => void;

    // Stream error
    errorStream: (event: StreamEvent) => void;

    // Stream management
    clearStream: (messageCode: string) => void;
    clearChatStreams: (chatCode: string) => void;
    clearAllStreams: () => void;

    // Getters
    getStreamMessage: (messageCode: string) => StreamMessage | undefined;
    getStreamMessagesByChatCode: (chatCode: string) => StreamMessage[];
    getActiveStreams: () => StreamMessage[];
    getCompletedStreams: () => StreamMessage[];
    getErrorStreams: () => StreamMessage[];
}

export const useSignalRStreamStore = create<SignalRStreamStore>((set, get) => ({
    // Initial state
    isConnected: false,
    connectionId: undefined,
    streamMessages: {},

    // Connection management
    setConnection: (isConnected, connectionId) =>
        set({ isConnected, connectionId }),

    // Add stream chunk
    addStreamChunk: (chunk) =>
        set((state) => {
            const existing = state.streamMessages[chunk.messageCode];

            if (existing) {
                // Update existing stream
                return {
                    streamMessages: {
                        ...state.streamMessages,
                        [chunk.messageCode]: {
                            ...existing,
                            chunks: [...existing.chunks, chunk],
                            completeText: chunk.completeText,
                            isStreaming: true,
                            isComplete: false,
                            hasError: false
                        }
                    }
                };
            } else {
                // Create new stream
                return {
                    streamMessages: {
                        ...state.streamMessages,
                        [chunk.messageCode]: {
                            messageCode: chunk.messageCode,
                            chatCode: chunk.chatCode,
                            chunks: [chunk],
                            isStreaming: true,
                            isComplete: false,
                            hasError: false,
                            completeText: chunk.completeText,
                            startTime: chunk.timestamp
                        }
                    }
                };
            }
        }),

    // Complete stream
    completeStream: (event) =>
        set((state) => {
            const existing = state.streamMessages[event.messageCode];
            if (!existing) return state;

            return {
                streamMessages: {
                    ...state.streamMessages,
                    [event.messageCode]: {
                        ...existing,
                        isStreaming: false,
                        isComplete: true,
                        hasError: false,
                        endTime: event.timestamp
                    }
                }
            };
        }),

    // Error stream
    errorStream: (event) =>
        set((state) => {
            const existing = state.streamMessages[event.messageCode];

            if (existing) {
                // Update existing with error
                return {
                    streamMessages: {
                        ...state.streamMessages,
                        [event.messageCode]: {
                            ...existing,
                            isStreaming: false,
                            isComplete: false,
                            hasError: true,
                            errorMessage: event.errorMessage,
                            endTime: event.timestamp
                        }
                    }
                };
            } else {
                // Create error-only stream
                return {
                    streamMessages: {
                        ...state.streamMessages,
                        [event.messageCode]: {
                            messageCode: event.messageCode,
                            chatCode: event.chatCode,
                            chunks: [],
                            isStreaming: false,
                            isComplete: false,
                            hasError: true,
                            errorMessage: event.errorMessage,
                            completeText: '',
                            startTime: event.timestamp,
                            endTime: event.timestamp
                        }
                    }
                };
            }
        }),

    // Clear single stream
    clearStream: (messageCode) =>
        set((state) => {
            const newStreamMessages = { ...state.streamMessages };
            delete newStreamMessages[messageCode];
            return { streamMessages: newStreamMessages };
        }),

    // Clear all streams for a specific chat
    clearChatStreams: (chatCode) =>
        set((state) => {
            const newStreamMessages = { ...state.streamMessages };
            Object.keys(newStreamMessages).forEach(messageCode => {
                if (newStreamMessages[messageCode].chatCode === chatCode) {
                    delete newStreamMessages[messageCode];
                }
            });
            return { streamMessages: newStreamMessages };
        }),

    // Clear all streams
    clearAllStreams: () => set({ streamMessages: {} }),

    // Get single stream message
    getStreamMessage: (messageCode) => get().streamMessages[messageCode],

    // Get streams by chat code
    getStreamMessagesByChatCode: (chatCode) => {
        const messages = Object.values(get().streamMessages);
        return messages
            .filter(msg => msg.chatCode === chatCode)
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    },

    // Get active streams
    getActiveStreams: () => {
        return Object.values(get().streamMessages)
            .filter(msg => msg.isStreaming);
    },

    // Get completed streams
    getCompletedStreams: () => {
        return Object.values(get().streamMessages)
            .filter(msg => msg.isComplete);
    },

    // Get error streams
    getErrorStreams: () => {
        return Object.values(get().streamMessages)
            .filter(msg => msg.hasError);
    }
}));
