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
    updateRoomChatInfo: (updates: Partial<RoomChatInfo>) => void;
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
    updateOldMessagesWithReadStatus: (roomId: string, activeUsersData: any[], currentUserId: number) => void;
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
    deleteRoom: (roomCode: string) => void;
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

    friendRequestOptimistic: Record<number, { item: any; expiresAt: number | null }>;
    setFriendRequestOptimistic: (item: any, ttlSec?: number) => void;
    removeFriendRequestOptimistic: (id: number) => void;
    clearFriendRequestOptimistic: () => void;
    hasFriendRequestOptimistic: (id: number) => boolean;
    getFriendRequestOptimisticList: () => any[];
    pruneExpiredFriendRequestOptimistic: () => void;

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
        updateRoomChatInfo: (updates) => 
            set((state) => {
                if (state.roomChatInfo) {
                    Object.assign(state.roomChatInfo, updates);
                }
            }),
        clearRoomChatInfo: () => set({ roomChatInfo: null }),
        roomMembers: [],
        setRoomMembers: (members) => set((state) => {
            const updatedMessagesByRoomId = { ...state.messagesByRoomId };
            if (Array.isArray(members)) {
                Object.keys(updatedMessagesByRoomId).forEach(roomId => {
                    const messages = updatedMessagesByRoomId[roomId];
                    updatedMessagesByRoomId[roomId] = messages.map(msg => {
                        if (msg.userHasRead && msg.userHasRead.length > 1) {
                            const updatedUserHasRead = msg.userHasRead.map(readUser => {
                                const member = members.find(m => m.userId === readUser.userId);
                                if (member?.user && readUser.userName.startsWith('User ')) {
                                    return {
                                        ...readUser,
                                        userName: member.user.userName || member.user.name || readUser.userName,
                                        userAvatar: member.user.userAvatar || member.user.avatar || readUser.userAvatar
                                    };
                                }
                                return readUser;
                            });
                            return { ...msg, userHasRead: updatedUserHasRead };
                        }
                        return msg;
                    });
                });
            }
            
            return { 
                roomMembers: Array.isArray(members) ? members : [],
                messagesByRoomId: updatedMessagesByRoomId
            };
        }),
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
                        roomMessages.push(newMsg);
                    } else {
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
            updateOldMessagesWithReadStatus: (roomId: string, activeUsersData: any[], currentUserId: number) =>
                set((state) => {
                    const roomMessages = state.messagesByRoomId[roomId];
                    if (!roomMessages || !activeUsersData.length) return;
                    const activeUserIds = activeUsersData.map(user => user.userId);
                    const recentMessagesByUser = new Map<number, number>();
                    for (let i = roomMessages.length - 1; i >= 0; i--) {
                        const msg = roomMessages[i];
                        if (msg.userId && !recentMessagesByUser.has(msg.userId)) {
                            recentMessagesByUser.set(msg.userId, i);
                        }
                    }
                    recentMessagesByUser.forEach((messageIndex, userId) => {
                        const msg = roomMessages[messageIndex];
                        const currentReadUsers = msg.userHasRead || [];
                        const newReadUsers = [...currentReadUsers];
                        
                        activeUsersData.forEach((activeUser) => {
                            const alreadyRead = currentReadUsers.some(user => user.userId === activeUser.userId);
                            if (!alreadyRead) {
                                newReadUsers.push(activeUser);
                            }
                        });
                        
                        if (newReadUsers.length > currentReadUsers.length) {
                            roomMessages[messageIndex] = {
                                ...msg,
                                userHasRead: newReadUsers
                            };
                        }
                    });
                    roomMessages.forEach((oldMsg:any, index) => {
                        if (oldMsg.userHasRead && 
                            oldMsg.userHasRead.length > 0 && 
                            !recentMessagesByUser.has(oldMsg.userId) || 
                            recentMessagesByUser.get(oldMsg.userId) !== index) {
                            const hasActiveUsers = oldMsg?.userHasRead?.some((reader:any) => 
                                activeUserIds.includes(reader.userId)
                            );
                            if (hasActiveUsers) {
                                const filteredUserHasRead = oldMsg.userHasRead.filter((reader:any) => 
                                    !activeUserIds.includes(reader.userId)
                                );
                                
                                roomMessages[index] = {
                                    ...oldMsg,
                                    userHasRead: filteredUserHasRead
                                };
                            }
                        }
                    });
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

        deleteRoom: (roomCode: string) =>
            set((state) => {
                state.chatRooms = state.chatRooms.filter(r => r.code !== roomCode);
                if (state.roomChatInfo?.code === roomCode) state.roomChatInfo = null;
                if (state.unreadByRoom && state.unreadByRoom[roomCode] !== undefined) delete state.unreadByRoom[roomCode];
                if (state.lastMessageByRoomId && state.lastMessageByRoomId[roomCode] !== undefined) delete state.lastMessageByRoomId[roomCode];
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

                    // for (let i = 0; i < roomMessages.length - 1; i++) {
                    //     if (roomMessages[i].userHasRead && roomMessages[i].userHasRead!.length > 0) {
                    //         const currentUserId = msg.userId;
                    //         const otherUsersRead = roomMessages[i].userHasRead!.filter(reader => 
                    //             !activeUserIds.includes(reader.userId)
                    //         );
                    //         if (otherUsersRead.length > 0) {
                    //             roomMessages[i] = {
                    //                 ...roomMessages[i],
                    //                 userHasRead: []
                    //             };
                    //         }
                    //     }
                    // }

                    setTimeout(() => {
                        set((state) => {
                            const roomIndex = state.chatRooms.findIndex(r => r.code === roomId);
                            if (roomIndex !== -1) {
                                state.chatRooms[roomIndex].updateDate = msg.createDate || new Date().toISOString();
                                const room = state.chatRooms.splice(roomIndex, 1)[0];
                                state.chatRooms.unshift(room);
                            }
                        });
                    }, 0);
                }
            }),

        updateChatRoomFromMessage: (message) =>
            set((state) => {
                const roomCode = message.chatInfo?.code;
                if (!roomCode) return;

                const roomIndex = state.chatRooms.findIndex(r => r.code === roomCode);

                if (roomIndex !== -1) {
                    const room = state.chatRooms[roomIndex];
                    room.updateDate = message.createDate || new Date().toISOString();
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

                    if (message.isEdited !== 1) {
                        const updatedRoom = state.chatRooms.splice(roomIndex, 1)[0];
                        state.chatRooms.unshift(updatedRoom);
                    }

                } else {
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

        friendRequestOptimistic: {},

        setFriendRequestOptimistic: (item, ttlSec = 120) =>
            set((state) => {
                const expiresAt = ttlSec > 0 ? Date.now() + ttlSec * 1000 : null;
                const id = item?.id;
                if (typeof id === 'number') {
                    state.friendRequestOptimistic[id] = { item, expiresAt };
                }
            }),

        removeFriendRequestOptimistic: (id) =>
            set((state) => {
                if (state.friendRequestOptimistic[id]) delete state.friendRequestOptimistic[id];
            }),

        clearFriendRequestOptimistic: () =>
            set((state) => {
                state.friendRequestOptimistic = {};
            }),

        hasFriendRequestOptimistic: (id) => {
            const st = get();
            const entry = st.friendRequestOptimistic[id];
            if (!entry) return false;
            if (entry.expiresAt && entry.expiresAt <= Date.now()) return false;
            return true;
        },

        getFriendRequestOptimisticList: () => {
            const st = get();
            const now = Date.now();
            return Object.values(st.friendRequestOptimistic)
                .filter((e) => !e.expiresAt || e.expiresAt > now)
                .map((e) => e.item);
        },

        pruneExpiredFriendRequestOptimistic: () =>
            set((state) => {
                const now = Date.now();
                for (const id of Object.keys(state.friendRequestOptimistic)) {
                    const entry = state.friendRequestOptimistic[+id];
                    if (entry?.expiresAt && entry.expiresAt <= now) {
                        delete state.friendRequestOptimistic[+id];
                    }
                }
            }),
    }))
);
