import { RoomChatInfo } from "@/pages/SocialChat/hooks/useSocialChat";
import { ChatMessage, Member } from "@/types/social-chat";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

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
    translateMessageByCode: (roomId: string, messageCode: string, updatedData: Partial<ChatMessage>) => void;

    updateMessageAndRepliesByCode: (roomId: string, messageCode: string, updatedData: Partial<ChatMessage>) => void;
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

    chatRooms: RoomChatInfo[];
    setChatRooms: (rooms: RoomChatInfo[]) => void;
    addChatRoom: (room: RoomChatInfo) => void;
    updateChatRoom: (roomCode: string, updatedRoom: Partial<RoomChatInfo>) => void;
    removeChatRoom: (roomCode: string) => void;
    getChatRoomByCode: (code: string) => RoomChatInfo | undefined;
    sortChatRoomsByDate: () => void;

    unreadByRoom: Record<string, number>;
    setRoomUnread: (roomCode: string, count: number) => void;
    clearRoomUnread: (roomCode: string) => void;
    getRoomUnread: (roomCode: string) => number;

    updateChatRoomFromMessage: (message: any) => void;

    notificationCounts: {
        userId: number;
        unreadRoomsCount: number;
        pendingFriendRequestsCount: number;
    };
    setNotificationCounts: (counts: { userId: number; unreadRoomsCount: number; pendingFriendRequestsCount: number }) => void;
    updateUnreadRoomsCount: (count: number) => void;
    updatePendingFriendRequestsCount: (count: number) => void;
    getTotalNotificationCount: () => number;
    resetNotificationCounts: () => void;
}
const toTs = (d?: string | null) => (d ? new Date(d).getTime() : 0);
const pickLocalOnly = (r: RoomChatInfo | undefined) => r ? ({

}) : ({});

export const useSocialChatStore = create<SocialChatState>()(
    immer((set, get) => ({
        search: "",
        setSearch: (value) => set({ search: value }),
        clearSearch: () => set({ search: "" }),
        unreadByRoom: {},

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

                msgs.forEach((newMsg) => {
                    const index = roomMessages.findIndex(
                        (existing) =>
                            existing.code === newMsg.code ||
                            (existing.tempId && existing.tempId === newMsg.tempId)
                    );

                    if (index === -1) {
                        // Chưa có → thêm mới
                        roomMessages.push(newMsg);
                    } else {
                        // Đã có → merge các field mới (giữ nguyên id, code, tempId, createDate cũ)
                        const existing = roomMessages[index];
                        roomMessages[index] = {
                            ...existing,
                            ...newMsg,
                            id: existing.id ?? newMsg.id,
                            code: existing.code,
                            tempId: existing.tempId,
                            createDate: existing.createDate,
                        };
                    }
                });
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

                const index = roomMessages.findIndex((msg) => msg.code === messageCode);
                if (index === -1) return;

                const current = roomMessages[index];
                const next = {
                    ...current,
                    ...updatedData,
                    id: current.id,
                    code: current.code,
                    tempId: current.tempId,
                    createDate: current.createDate,
                    timeStamp: current.timeStamp,
                    isEdited: 1,
                };
                roomMessages[index] = next;

                const last = state.lastMessageByRoomId[roomId];
                if (last && last.code === messageCode) {
                    state.lastMessageByRoomId[roomId] = { ...last, ...next };
                }
            }),
        translateMessageByCode: (roomId, messageCode, updatedData) =>
            set((state) => {
                const roomMessages = state.messagesByRoomId[roomId];
                if (!roomMessages) return;

                const index = roomMessages.findIndex((msg) => msg.code === messageCode);
                if (index === -1) return;

                const current = roomMessages[index];
                const next = {
                    ...current,
                    ...updatedData,
                    id: current.id,
                    code: current.code,
                    tempId: current.tempId,
                    createDate: current.createDate,
                    timeStamp: current.timeStamp,
                };
                roomMessages[index] = next;

                const last = state.lastMessageByRoomId[roomId];
                if (last && last.code === messageCode) {
                    state.lastMessageByRoomId[roomId] = { ...last, ...next };
                }
            }),
        updateMessageAndRepliesByCode: (roomId, messageCode, updatedData) =>
            set((state) => {
                const roomMessages = state.messagesByRoomId[roomId];
                if (!roomMessages) return;

                const idx = roomMessages.findIndex(m => m.code === messageCode);
                if (idx !== -1) {
                    const cur = roomMessages[idx];
                    roomMessages[idx] = {
                        ...cur,
                        ...updatedData,
                        id: cur.id,
                        code: cur.code,
                        tempId: cur.tempId,
                        createDate: cur.createDate,
                        timeStamp: cur.timeStamp,
                        isEdited: updatedData.isEdited ?? 1,
                    };
                }
                for (let i = 0; i < roomMessages.length; i++) {
                    const msg = roomMessages[i];
                    const parent = msg.replyToMessage;
                    if (parent && parent.code === messageCode) {
                        const mergedParent = {
                            ...parent,
                            ...updatedData,
                            id: parent.id,
                            code: parent.code,
                            tempId: parent.tempId,
                            createDate: parent.createDate,
                            timeStamp: parent.timeStamp,
                            isEdited: updatedData.isEdited ?? parent.isEdited ?? 1,
                        };

                        roomMessages[i] = {
                            ...msg,
                            replyToMessage: mergedParent,
                        };
                        if (updatedData.isRevoked === 1) {
                            (roomMessages[i] as any).replyPreviewText = "Tin nhắn đã được thu hồi";
                        } else if (updatedData.isEdited === 1 && typeof updatedData.messageText === "string") {
                            (roomMessages[i] as any).replyPreviewText = `${updatedData.messageText} (đã chỉnh sửa)`;
                        } else if (typeof updatedData.messageText === "string") {
                            (roomMessages[i] as any).replyPreviewText = updatedData.messageText;
                        }
                    }
                }
                const last = state.lastMessageByRoomId[roomId];
                if (last && last.code === messageCode) {
                    state.lastMessageByRoomId[roomId] = { ...last, ...updatedData, isEdited: updatedData.isEdited ?? 1 };
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

        chatRooms: [],

        setChatRooms: (rooms) =>
            set((state) => {
                const byCode = new Map(state.chatRooms.map(r => [r.code, r]));

                for (const incoming of rooms) {
                    if (incoming.lastMessageInfo) {
                        state.lastMessageByRoomId[incoming.code] = { ...incoming.lastMessageInfo } as any;
                    }
                    const existing = byCode.get(incoming.code);
                    if (!existing) {
                        byCode.set(incoming.code, { ...incoming, ...pickLocalOnly(undefined) });
                        continue;
                    }
                    const inFresh = Math.max(toTs(incoming.updateDate), toTs(incoming.lastMessageInfo?.createDate));
                    const exFresh = Math.max(toTs(existing.updateDate), toTs(existing.lastMessageInfo?.createDate));
                    if (inFresh >= exFresh) {
                        byCode.set(incoming.code, {
                            ...incoming,
                            ...pickLocalOnly(existing),
                        });
                    } else {
                    }
                }

                state.chatRooms = Array.from(byCode.values()).sort((a, b) => {
                    const da = toTs(a.updateDate);
                    const db = toTs(b.updateDate);
                    return db - da;
                });
            }),
        addChatRoom: (room) =>
            set((state) => {
                const exists = state.chatRooms.some(r => r.code === room.code);
                if (!exists) {
                    state.chatRooms.unshift(room);
                }
            }),

        updateChatRoom: (roomCode, updatedRoom) =>
            set((state) => {
                const index = state.chatRooms.findIndex(r => r.code === roomCode);
                if (index !== -1) {
                    state.chatRooms[index] = {
                        ...state.chatRooms[index],
                        ...updatedRoom
                    };

                    state.chatRooms.sort((a, b) => {
                        const dateA = new Date(a.updateDate || 0).getTime();
                        const dateB = new Date(b.updateDate || 0).getTime();
                        return dateB - dateA;
                    });
                }
            }),

        removeChatRoom: (roomCode) =>
            set((state) => {
                state.chatRooms = state.chatRooms.filter(r => r.code !== roomCode);
            }),

        getChatRoomByCode: (code) => {
            const state = get();
            return state.chatRooms.find(r => r.code === code);
        },

        sortChatRoomsByDate: () =>
            set((state) => {
                state.chatRooms.sort((a, b) => {
                    const dateA = new Date(a.updateDate || 0).getTime();
                    const dateB = new Date(b.updateDate || 0).getTime();
                    return dateB - dateA;
                });
            }),

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
                    state.lastMessageByRoomId[roomId] = msg;

                    const roomIndex = state.chatRooms.findIndex(r => r.code === roomId);
                    if (roomIndex !== -1) {
                        state.chatRooms[roomIndex].updateDate = msg.createDate || new Date().toISOString();
                        const room = state.chatRooms.splice(roomIndex, 1)[0];
                        state.chatRooms.unshift(room);
                    }
                }
            }),

        updateChatRoomFromMessage: (message) =>
            set((state) => {
                const roomCode = message.chatInfo?.code;
                if (!roomCode) return;

                const roomIndex = state.chatRooms.findIndex(r => r.code === roomCode);

                if (roomIndex !== -1) {
                    const room = state.chatRooms[roomIndex];

                    // Update room properties
                    room.updateDate = message.createDate || new Date().toISOString();

                    // Update last message info
                    const displayText = message.isRevoked === 1
                        ? "Tin nhắn đã được thu hồi"
                        : message.isEdited === 1
                            ? `${message.messageText} (đã chỉnh sửa)`
                            : message.messageText;

                    room.lastMessageInfo = {
                        messageText: displayText,
                        createDate: message.createDate,
                        userName: message.userName,
                        userAvatar: message.userAvatar
                    };

                    // Move room to top only for new messages, not edited ones
                    if (message.isEdited !== 1) {
                        const updatedRoom = state.chatRooms.splice(roomIndex, 1)[0];
                        state.chatRooms.unshift(updatedRoom);
                    }

                } else {
                    // Create new room if not found (only for new messages)
                    if (message.chatInfo && message.isEdited !== 1) {
                        const newRoom: RoomChatInfo = {
                            id: message.chatInfo.id,
                            code: message.chatInfo.code,
                            title: message.chatInfo.title,
                            avatarRoomChat: message.chatInfo.avatarRoomChat,
                            type: message.chatInfo.type,
                            status: message.chatInfo.status,
                            createDate: message.chatInfo.createDate,
                            updateDate: message.createDate || new Date().toISOString(),
                            unreadCount: 1,
                            lastMessageInfo: {
                                messageText: message.messageText,
                                createDate: message.createDate,
                                userName: message.userName,
                                userAvatar: message.userAvatar
                            },
                            participants: message.chatInfo.participants || [],
                            topic: message.chatInfo.topic,
                            chatInfo: null
                        };

                        state.chatRooms.unshift(newRoom);
                    }
                }
            }),

        setRoomUnread: (roomCode, count) =>
            set((state) => {
                state.unreadByRoom[roomCode] = Math.max(0, count | 0);

                const idx = state.chatRooms.findIndex(r => r.code === roomCode);
                if (idx !== -1) state.chatRooms[idx].unreadCount = state.unreadByRoom[roomCode];
            }),

        clearRoomUnread: (roomCode) =>
            set((state) => {
                state.unreadByRoom[roomCode] = 0;
                const idx = state.chatRooms.findIndex(r => r.code === roomCode);
                if (idx !== -1) state.chatRooms[idx].unreadCount = 0;
            }),

        getRoomUnread: (roomCode) => {
            const st = get();
            return st.unreadByRoom[roomCode] ?? 0;
        },

        notificationCounts: {
            userId: 0,
            unreadRoomsCount: 0,
            pendingFriendRequestsCount: 0,
        },

        setNotificationCounts: (counts) =>
            set((state) => {
                state.notificationCounts = {
                    userId: counts.userId || 0,
                    unreadRoomsCount: Math.max(0, counts.unreadRoomsCount || 0),
                    pendingFriendRequestsCount: Math.max(0, counts.pendingFriendRequestsCount || 0),
                };
            }),

        updateUnreadRoomsCount: (count) =>
            set((state) => {
                state.notificationCounts.unreadRoomsCount = Math.max(0, count);
            }),

        updatePendingFriendRequestsCount: (count) =>
            set((state) => {
                state.notificationCounts.pendingFriendRequestsCount = Math.max(0, count);
            }),

        getTotalNotificationCount: () => {
            const state = get();
            return state.notificationCounts.unreadRoomsCount + state.notificationCounts.pendingFriendRequestsCount;
        },

        resetNotificationCounts: () =>
            set((state) => {
                state.notificationCounts = {
                    userId: 0,
                    unreadRoomsCount: 0,
                    pendingFriendRequestsCount: 0,
                };
            }),
    }))
);
