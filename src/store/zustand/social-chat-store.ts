import { RoomChatInfo } from "@/pages/SocialChat/hooks/useSocialChat";
import { ChatMessage, Member } from "@/types/social-chat";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";

interface SocialChatState {
    search: string;
    setSearch: (value: string) => void;
    clearSearch: () => void;

    roomChatInfo: RoomChatInfo | null;
    setRoomChatInfo: (room: RoomChatInfo) => void;
    clearRoomChatInfo: () => void;

    roomMembers: Member[];
    setRoomMembers: (members: Member[]) => void;
    clearRoomMembers: () => void;

    messagesByRoomId: Record<string, ChatMessage[]>;
    activeRoomId: string | null;

    setActiveRoomId: (roomId: string | null) => void;
    getMessagesForRoom: (roomId: string) => ChatMessage[];
    setMessages: (roomId: string, msgs: ChatMessage[]) => void;
    addMessage: (roomId: string, msg: ChatMessage) => void;
    addMessages: (roomId: string, msgs: ChatMessage[]) => void;
    updateMessage: (roomId: string, msg: ChatMessage) => void;
    updateMessageByTempId: (roomId: string, msg: ChatMessage) => void;
    updateMessageWithServerResponse: (roomId: string, tempId: string, serverData: Partial<ChatMessage>) => void;
    updateMessageByCode: (roomId: string, messageCode: string, updatedData: Partial<ChatMessage>) => void;
    removeMessage: (roomId: string, tempId: string) => void;
    clearMessages: (roomId?: string) => void;

    replyingToMessageByRoomId: Record<string, ChatMessage | null>;
    setReplyingToMessage: (roomId: string, message: ChatMessage | null) => void;
    clearReplyingToMessage: (roomId: string) => void;

    loadingMessagesByRoomId: Record<string, boolean>;
    setLoadingMessages: (roomId: string, loading: boolean) => void;
    getLoadingForRoom: (roomId: string) => boolean;

    lastMessageByRoomId: Record<string, ChatMessage>;
    updateLastMessage: (roomId: string, message: ChatMessage) => void;
    getLastMessageForRoom: (roomId: string) => ChatMessage | null;
}

export const useSocialChatStore = create<SocialChatState>()(
    immer((set, get) => ({
        search: "",
        setSearch: (value) => set({ search: value }),
        clearSearch: () => set({ search: "" }),

        roomChatInfo: null,
        setRoomChatInfo: (room) => set({ roomChatInfo: room }),
        clearRoomChatInfo: () => set({ roomChatInfo: null }),

        roomMembers: [],
        setRoomMembers: (members) => set({ roomMembers: members }),
        clearRoomMembers: () => set({ roomMembers: [] }),

        messagesByRoomId: {},
        activeRoomId: null,
        loadingMessagesByRoomId: {},

        replyingToMessageByRoomId: {},

        setActiveRoomId: (roomId) => set({ activeRoomId: roomId }),

        getMessagesForRoom: (roomId) => {
            const state = get();
            return state.messagesByRoomId[roomId] || [];
        },

        getLoadingForRoom: (roomId) => {
            const state = get();
            return state.loadingMessagesByRoomId[roomId] || false;
        },

        setMessages: (roomId, msgs) =>
            set((state) => {
                state.messagesByRoomId[roomId] = msgs;
            }),

        // addMessage: (roomId, msg) =>
        //     set((state) => {
        //         if (!state.messagesByRoomId[roomId]) {
        //             state.messagesByRoomId[roomId] = [];
        //         }

        //         const roomMessages = state.messagesByRoomId[roomId];
        //         const exists = roomMessages.some(
        //             (existing) => existing.code === msg.code ||
        //                 (existing.tempId && existing.tempId === msg.tempId)
        //         );

        //         if (!exists) {
        //             state.messagesByRoomId[roomId].push(msg);
        //         }
        //     }),

        addMessages: (roomId, msgs) =>
            set((state) => {
                if (!state.messagesByRoomId[roomId]) {
                    state.messagesByRoomId[roomId] = [];
                }

                const roomMessages = state.messagesByRoomId[roomId];
                const uniqueMessages = msgs.filter(
                    (newMsg) => !roomMessages.some((existing) =>
                        existing.code === newMsg.code ||
                        (existing.tempId && existing.tempId === newMsg.tempId)
                    )
                );

                if (uniqueMessages.length > 0) {
                    state.messagesByRoomId[roomId] = [...roomMessages, ...uniqueMessages];
                }
            }),

        updateMessage: (roomId, updatedMsg) =>
            set((state) => {
                const roomMessages = state.messagesByRoomId[roomId];
                if (!roomMessages) return;

                const index = roomMessages.findIndex(
                    (msg) => msg.tempId === updatedMsg.tempId || msg.code === updatedMsg.code
                );

                if (index !== -1) {
                    state.messagesByRoomId[roomId][index] = updatedMsg;
                }
            }),

        updateMessageByTempId: (roomId, updatedMsg) =>
            set((state) => {
                const roomMessages = state.messagesByRoomId[roomId];
                if (!roomMessages) return;

                const index = roomMessages.findIndex(
                    (msg) => msg.tempId === updatedMsg.tempId
                );

                if (index !== -1) {
                    state.messagesByRoomId[roomId][index] = {
                        ...state.messagesByRoomId[roomId][index],
                        ...updatedMsg
                    };
                }
            }),

        updateMessageWithServerResponse: (roomId, tempId, serverData) =>
            set((state) => {
                const roomMessages = state.messagesByRoomId[roomId];
                if (!roomMessages) return;

                const index = roomMessages.findIndex(
                    (msg) => msg.tempId === tempId
                );

                if (index !== -1) {
                    const msg = state.messagesByRoomId[roomId][index];
                    Object.assign(msg, {
                        ...serverData,
                        id: serverData.id !== undefined ? serverData.id : msg.id,
                        isSend: true,
                        isError: false,
                    });
                }
            }),

        updateMessageByCode: (roomId, messageCode, updatedData) =>
            set((state) => {
                const roomMessages = state.messagesByRoomId[roomId];
                if (!roomMessages) return;

                const index = roomMessages.findIndex(
                    (msg) => msg.code === messageCode
                );

                if (index !== -1) {
                    const currentMessage = state.messagesByRoomId[roomId][index];
                    state.messagesByRoomId[roomId][index] = {
                        ...currentMessage,
                        ...updatedData,
                        id: currentMessage.id,
                        code: currentMessage.code,
                        tempId: currentMessage.tempId,
                        createDate: currentMessage.createDate,
                        timeStamp: currentMessage.timeStamp,
                        isEdited: 1
                    };
                }
            }),

        setReplyingToMessage: (roomId, message) =>
            set((state) => {
                state.replyingToMessageByRoomId[roomId] = message;
            }),

        clearReplyingToMessage: (roomId) =>
            set((state) => {
                state.replyingToMessageByRoomId[roomId] = null;
            }),

        removeMessage: (roomId, tempId) =>
            set((state) => {
                const roomMessages = state.messagesByRoomId[roomId];
                if (!roomMessages) return;

                state.messagesByRoomId[roomId] = roomMessages.filter(
                    (msg) => msg.tempId !== tempId
                );
            }),

        clearMessages: (roomId) =>
            set((state) => {
                if (roomId) {
                    state.messagesByRoomId[roomId] = [];
                } else {
                    state.messagesByRoomId = {};
                }
            }),

        setLoadingMessages: (roomId, loading) =>
            set((state) => {
                state.loadingMessagesByRoomId[roomId] = loading;
            }),

            lastMessageByRoomId: {},
        
        updateLastMessage: (roomId, message) =>
            set((state) => {
                state.lastMessageByRoomId[roomId] = message;
            }),
            
        getLastMessageForRoom: (roomId) => {
            return get().lastMessageByRoomId[roomId] || null;
        },
        
        // Update existing addMessage to also update lastMessage
        addMessage: (roomId, msg) =>
            set((state) => {
                if (!state.messagesByRoomId[roomId]) {
                    state.messagesByRoomId[roomId] = [];
                }
                
                const roomMessages = state.messagesByRoomId[roomId];
                const exists = roomMessages.some(
                    (existing) => existing.code === msg.code || 
                    (existing.tempId && existing.tempId === msg.tempId)
                );
                
                if (!exists) {
                    state.messagesByRoomId[roomId].push(msg);
                    // Update last message
                    state.lastMessageByRoomId[roomId] = msg;
                }
            }),
    }))
);
