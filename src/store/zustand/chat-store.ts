import { ChatMessage } from "@/pages/Chat/hooks/useChatMessages";
import { UserChatByTopicResponse } from "@/services/chat/chat-types";
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
    pendingMessages: { text: string; createdAt: string; timeStamp?: number }[];
    setPendingMessages: (fn: (prev: { text: string; createdAt: string; timeStamp?: number }[]) => { text: string; createdAt: string; timeStamp?: number }[]) => void;
    clearPendingMessages: () => void;
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
        set((state) => ({ pendingMessages: fn(state.pendingMessages) })),
    clearPendingMessages: () => set({ pendingMessages: [] }),
}));