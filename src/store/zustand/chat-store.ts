import { ChatMessage } from "@/pages/Chat/hooks/useChatMessages";
import { UserChatByTopicResponse } from "@/services/chat/chat-types";
import { isError } from "lodash";
import { create } from "zustand";

interface ChatStoreState {
    chats: UserChatByTopicResponse["data"];
    setChats: (chats: UserChatByTopicResponse["data"]) => void;
    messages: ChatMessage[];
    setMessages: (messages: ChatMessage[]) => void;
    addMessage: (msg: ChatMessage) => void;
    clearMessages: () => void;
    isSending: boolean;
    setIsSending: (val: boolean) => void;
    pendingMessages: {
        attachments: any;
        chatCode: any;
        id: any;
        text: string;
        createdAt: string;
        timeStamp?: number;
        isError?: boolean;
    }[];
    setPendingMessages: (fn: (prev: { attachments: any; chatCode: any; id: any; text: string; createdAt: string; timeStamp?: number; isError?: boolean }[]) => { attachments: any; chatCode: any; id: any; text: string; createdAt: string; timeStamp?: number; isError?: boolean }[]) => void;
    clearPendingMessages: () => void;
    stopMessages: boolean
    setStopMessages: (val: boolean) => void;
}

export const useChatStore = create<ChatStoreState>((set) => ({
    chats: [],
    setChats: (chats) => set({ chats }),
    messages: [],
    setMessages: (messages) => set({ messages }),
    addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
    clearMessages: () => set({ messages: [] }),
    isSending: false,
    setIsSending: (val) => set({ isSending: val }),
    pendingMessages: [],
    setPendingMessages: (fn) =>
        set((state) => ({
            pendingMessages: fn(state.pendingMessages).map(msg => ({
                attachments: msg.attachments ?? [],
                chatCode: msg.chatCode,
                id: msg.id,
                text: msg.text,
                createdAt: msg.createdAt,
                timeStamp: msg.timeStamp,
                isError: msg?.isError
            }))
        })),
    clearPendingMessages: () => set({ pendingMessages: [] }),
    stopMessages: true,
    setStopMessages: (val) => set({ stopMessages: val })
}));