import { create } from "zustand";

interface SignalRChatState {
    isConnected: boolean;
    setIsConnected: (val: boolean) => void;
    messages: object[];
    setMessages: (messages: object[]) => void;
    addMessage: (msg: object) => void;
    sendMessage?: (method: string, ...args: any[]) => Promise<void>;
    setSendMessage: (fn: (method: string, ...args: any[]) => Promise<void>) => void;
}

export const useSignalRChatStore = create<SignalRChatState>((set) => ({
    isConnected: false,
    setIsConnected: (val) => set({ isConnected: val }),
    messages: [],
    setMessages: (messages) => set({ messages }),
    addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
    sendMessage: undefined,
    setSendMessage: (fn) => set({ sendMessage: fn }),
}));