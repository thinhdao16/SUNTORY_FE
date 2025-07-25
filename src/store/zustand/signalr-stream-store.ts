import { ChatMessage } from "@/pages/Chat/hooks/useChatMessages";
import { getChatMessage } from "@/services/chat/chat-service";
import { create } from "zustand";

export interface StreamChunk {
    chatCode: string;
    messageCode: string;
    chunk: string;
    completeText: string;
    timestamp: string;
    id: number;
    userMessageId: number;
    code: string;
}

export interface StreamEvent {
    chatCode: string;
    messageCode: string;
    timestamp: string;
    errorMessage?: string;
    code: string;
    id: number;
    completeText?: string;
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
    code: string;
    id: number
}

interface SignalRStreamStore {
    isConnected: boolean;
    connectionId?: string;
    streamMessages: Record<string, StreamMessage>;
    completedMessages: ChatMessage[]; // Đổi tên từ allFetchedMessages
    setConnection: (isConnected: boolean, connectionId?: string) => void;
    addStreamChunk: (chunk: StreamChunk) => void;
    startTyping: (chatCode: string, messageCode: string) => void;
    completeStream: (event: StreamEvent) => void;
    errorStream: (event: StreamEvent) => void;
    clearStream: (messageCode: string) => void;
    clearChatStreams: (chatCode: string) => void;
    clearAllStreams: () => void;
    getStreamMessage: (messageCode: string) => StreamMessage | undefined;
    getStreamMessagesByChatCode: (chatCode: string) => StreamMessage[];
    getActiveStreams: () => StreamMessage[];
    getCompletedStreams: () => StreamMessage[];
    getErrorStreams: () => StreamMessage[];
    getCompletedMessages: (chatCode?: string) => ChatMessage[];
    // currentChatStream: {
    //     messageCode: string;
    //     text: string;
    //     isComplete?: boolean;
    // };
    // setCurrentChatStream: any;
    // clearCurrentChatStream: () => void;
    chatCode: string;
    setChatCode: (chatCode: string) => void;
}

export const useSignalRStreamStore = create<SignalRStreamStore>((set, get) => ({
    isConnected: false,
    connectionId: undefined,
    streamMessages: {},
    completedMessages: [],
    // currentChatStream: {
    //     messageCode: '',
    //     text: '',
    //     isComplete: false,
    // },
    setConnection: (isConnected, connectionId) =>
        set({ isConnected, connectionId }),

    addStreamChunk: (chunk) =>
        setTimeout(() => {
            set(state => {
                const existing = state.streamMessages[chunk.messageCode];
                const fullText = chunk.completeText;

                // Nếu đã có entry cho message này
                if (existing) {
                    const prevText = existing.completeText || "";
                    const delta = fullText.slice(prevText.length);

                    // Không có gì mới thì không update
                    if (!delta) {
                        return {};
                    }

                    return {
                        streamMessages: {
                            ...state.streamMessages,
                            [chunk.messageCode]: {
                                ...existing,
                                // Append object chunk vào mảng chunks nếu bạn vẫn cần giữ history
                                chunks: [...existing.chunks, chunk],
                                // Cập nhật completeText lên fullText mới nhất
                                completeText: fullText,
                                isStreaming: true,
                                isComplete: false,
                                hasError: false,
                            }
                        }
                    };
                }

                // Lần đầu tạo mới entry
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
                            completeText: fullText,
                            startTime: chunk.timestamp,
                            code: chunk.code,
                            id: chunk.id,
                            userMessageId: chunk.userMessageId
                        }
                    }
                };
            });
        }, 0),

    startTyping: (chatCode, messageCode) =>
        set((state) => {
            if (state.streamMessages[messageCode]) {
                return state;
            }

            return {
                streamMessages: {
                    ...state.streamMessages,
                    [messageCode]: {
                        messageCode,
                        chatCode,
                        chunks: [],
                        isStreaming: true,
                        isComplete: false,
                        hasError: false,
                        completeText: '',
                        startTime: new Date().toISOString(),
                        code: messageCode,
                        id: Date.now(),
                        userMessageId: -1
                    }
                }
            };
        }),

    completeStream: (event) => {
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
        });

        getChatMessage(event.code)
            .then((data) => {
                set((state) => {
                    // Merge completed messages, loại bỏ duplicate
                    const existingMessages = state.completedMessages;
                    const newMessages = data.filter(newMsg =>
                        !existingMessages.some(existing => existing.id === newMsg.id)
                    );

                    return {
                        completedMessages: [...existingMessages, ...newMessages]
                    };
                });
            })
            .catch((error) => {
                console.error('Failed to fetch completed messages:', error);
            });
    },

    errorStream: (event) => {
        set((state) => {
            const existing = state.streamMessages[event.messageCode];

            if (!existing) return state;
            return {
                streamMessages: {
                    ...state.streamMessages,
                    [event.messageCode]: {
                        ...existing,
                        isStreaming: false,
                        isComplete: false,
                        hasError: true,
                        errorMessage: event.errorMessage,
                        endTime: event.timestamp,
                    }
                }
            };
        });

        getChatMessage(event.code)
            .then((data) => {
                set((state) => {
                    const existingMessages = state.completedMessages;
                    const newMessages = data.filter(newMsg =>
                        !existingMessages.some(existing => existing.id === newMsg.id)
                    );

                    return {
                        completedMessages: [...existingMessages, ...newMessages]
                    };
                });
            })
            .catch((error) => {
                console.error('Failed to fetch error messages:', error);
            });
    },

    clearStream: (messageCode) =>
        set((state) => {
            const newStreamMessages = { ...state.streamMessages };
            delete newStreamMessages[messageCode];
            return { streamMessages: newStreamMessages };
        }),

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

    clearAllStreams: () => set({
        streamMessages: {}, completedMessages: []
        // , currentChatStream: {
        //     messageCode: "",
        //     text: ""
        // }
    }),

    getStreamMessage: (messageCode) => get().streamMessages[messageCode],

    getStreamMessagesByChatCode: (chatCode) => {
        const messages = Object.values(get().streamMessages);
        return messages
            .filter(msg => msg.chatCode === chatCode)
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    },

    getActiveStreams: () => {
        return Object.values(get().streamMessages)
            .filter(msg => msg.isStreaming);
    },

    getCompletedStreams: () => {
        return Object.values(get().streamMessages)
            .filter(msg => msg.isComplete);
    },

    getErrorStreams: () => {
        return Object.values(get().streamMessages)
            .filter(msg => msg.hasError);
    },

    getCompletedMessages: (chatCode) => {
        const allMessages = get().completedMessages;
        if (!chatCode) return allMessages;

        return allMessages.filter(msg => msg.chatCode === chatCode);
    },
    // setCurrentChatStream: (data: StreamChunk) => {
    //     setTimeout(() => {
    //         set(state => {
    //             const prev = state.currentChatStream;
    //             const fullText = data.completeText;
    //             if (!prev || prev.messageCode !== data.messageCode) {
    //                 return {
    //                     currentChatStream: {
    //                         messageCode: data.messageCode,
    //                         text: fullText,
    //                         isComplete: false,
    //                     }
    //                 };
    //             }
    //             const prevText = prev.text;
    //             const delta = fullText.slice(prevText.length);
    //             if (!delta) {
    //                 return {};
    //             }
    //             return {
    //                 currentChatStream: {
    //                     messageCode: data.messageCode,
    //                     text: prevText + delta,
    //                     isComplete: false,
    //                 }
    //             };
    //         });
    //     }, 0);
    // },




    chatCode: '',
    setChatCode: (chatCode: string) => set({ chatCode }),
    // clearCurrentChatStream: () =>
    //     set(() => ({
    //         currentChatStream: {
    //             messageCode: "",
    //             text: "",
    //             isComplete: false,
    //         }
    //     })),

}));
