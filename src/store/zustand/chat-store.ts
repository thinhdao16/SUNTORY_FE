/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChatMessage } from "@/pages/Chat/hooks/useChatMessages";
import { ChatHistoryLastModuleItem, UserChatByTopicResponse } from "@/services/chat/chat-types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

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
        isSend?: boolean;
    }[];
    setPendingMessages: (fn: (prev: { attachments: any; chatCode: any; id: any; text: string; createdAt: string; timeStamp?: number; isError?: boolean; isSend?: boolean }[]) => { attachments: any; chatCode: any; id: any; text: string; createdAt: string; timeStamp?: number; isError?: boolean; isSend?: boolean }[]) => void;
    clearPendingMessages: () => void;
    stopMessages: boolean
    setStopMessages: (val: boolean) => void;
    sessionId: string | null;
    sessionCreatedAt: number | null;
    setSession: (id: string) => void;
    clearSession: () => void;
    chatHistory: ChatHistoryLastModuleItem[];
    setChatHistory: (history: ChatHistoryLastModuleItem[]) => void;


}

export const useChatStore = create<ChatStoreState>()(
    persist(
        (set) => ({
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
                        isError: msg?.isError,
                        isSend: msg?.isSend,
                    }))
                })),
            clearPendingMessages: () => set({ pendingMessages: [] }),
            stopMessages: true,
            setStopMessages: (val) => set({ stopMessages: val }),
            sessionId: null,
            sessionCreatedAt: null,
            setSession: (id: string) =>
                set({
                    sessionId: id,
                    sessionCreatedAt: Date.now(),
                }),
            clearSession: () =>
                set({
                    sessionId: null,
                    sessionCreatedAt: null,
                }),
            chatHistory: [],
            setChatHistory: (history) => set({ chatHistory: history }),
        }),
        {
            name: "chat-session",
            partialize: (state) => ({
                sessionId: state.sessionId,
                sessionCreatedAt: state.sessionCreatedAt,
                chatHistory: state.chatHistory,
            }),
        }
    )
);