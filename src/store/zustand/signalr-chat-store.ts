import { create } from "zustand";

type ConnectionStatus = "connected" | "connecting" | "disconnected";
interface SignalRChatState {
    isConnected: ConnectionStatus;
    setIsConnected: (val: ConnectionStatus) => void;
    messages: object[];
    setMessages: (messages: object[]) => void;
    addMessage: (msg: object) => void;
    sendMessage?: (method: string, ...args: any[]) => Promise<void>;
    setSendMessage: (fn: (method: string, ...args: any[]) => Promise<void>) => void;
    hasFirstSignalRMessage: boolean;
    setHasFirstSignalRMessage: (val: boolean) => void;
}

export const useSignalRChatStore = create<SignalRChatState>((set) => ({
    isConnected: "disconnected",
    setIsConnected: (val) => set({ isConnected: val }),
    messages: [],
    setMessages: (messages) => set({ messages }),
    addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
    sendMessage: undefined,
    setSendMessage: (fn) => set({ sendMessage: fn }),
    hasFirstSignalRMessage: false,
    setHasFirstSignalRMessage: (val) => set({ hasFirstSignalRMessage: val }),
}));