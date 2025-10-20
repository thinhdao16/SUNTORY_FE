import httpClient from "@/config/http-client";
import { AddGroupMembersPayload, CreateSocialChatMessagePayload, GetSocialChatMessagesParams, NotificationCounts, RemoveGroupMembersPayload, RevokeSocialChatMessagePayload, UpdateSocialChatMessagePayload,UpdateChatRoomPayload } from "./social-chat-type";

export const getUserChatRooms = async (params: { PageNumber?: number; PageSize?: number; Keyword?: string, Type?: number } = {}) => {
    const { PageNumber = 0, PageSize = 100, Keyword, Type } = params;
    const res = await httpClient.get(`api/v1/chat-user/chatrooms`, {
        params: { PageNumber, PageSize, Keyword, Type },
    });
    return res.data?.data?.data || [];
};

// Returns the full response with pagination metadata under .data
export const getUserChatRoomsWithMeta = async (params: { PageNumber?: number; PageSize?: number; Keyword?: string, Type?: number } = {}) => {
    const { PageNumber = 0, PageSize = 100, Keyword, Type } = params;
    const res = await httpClient.get(`api/v1/chat-user/chatrooms`, {
        params: { PageNumber, PageSize, Keyword, Type },
    });
    return res.data; // expect shape: { code, message, data: { data: Room[], pageNumber, totalPages, nextPage, ... } }
};
export const getChatRoomByCode = async (code: string) => {
    const res = await httpClient.get(`/api/v1/chat-user/chatroom/${code}`);
    return res.data?.data || null;
};
export const createAnonymousChatRoom = async (otherUserId: number) => {
    const res = await httpClient.post("/api/v1/chat-user/chatroom/create-anonymous", {
        otherUserId,
    });
    return res.data.data;
};
export async function createSocialChatMessageApi(payload: CreateSocialChatMessagePayload) {
    const res = await httpClient.post("/api/v1/chat-user/message/send", payload);
    return res.data.data;
}
export const getSocialChatMessages = async (params: GetSocialChatMessagesParams) => {
    const response = await httpClient.get("/api/v1/chat-user/messages", {
        params: {
            chatCode: params.chatCode,
            keyword: params.keyword || undefined,
            PageNumber: params.PageNumber,
            PageSize: params.PageSize,
        }
    });

    return response.data?.data || [];
};

export async function updateSocialChatMessageApi(payload: UpdateSocialChatMessagePayload) {
    const res = await httpClient.put("/api/v1/chat-user/message/update", payload);
    return res.data.data;
}
export async function revokeSocialChatMessageApi(payload: RevokeSocialChatMessagePayload) {
    const res = await httpClient.put("/api/v1/chat-user/message/revoke", payload);
    return res.data.data;
};
export const getNotificationCounts = async (): Promise<NotificationCounts> => {
    const response = await httpClient.get('/api/v1/chat-user/notifications/counts');
    return response.data.data;
};
export const chatRoomAttachments = async ({
    ChatCode,
    PageNumber = 0,
    PageSize = 20
}: {
    ChatCode: string;
    PageNumber?: number;
    PageSize?: number;
}) => {
    const response = await httpClient.get('/api/v1/chat-user/chatroom/attachments', {
        params: {
            ChatCode,
            PageNumber,
            PageSize
        }
    });
    return response.data;
};

export const addGroupMembersApi = async (payload: AddGroupMembersPayload) => {
    const response = await httpClient.post('/api/v1/chat-user/chatroom/member/add', payload);
    return response.data;
};

export const removeGroupMembersApi = async (payload: RemoveGroupMembersPayload) => {
    const response = await httpClient.post('/api/v1/chat-user/chatroom/member/remove', payload);
    return response.data;
};

export const leaveChatRoomApi = async (payload: { chatCode: string; newAdminUserId?: number }) => {
    const response = await httpClient.post('/api/v1/chat-user/chatroom/leave', payload);
    return response.data;
};
export const removeChatRoomApi = async (payload: { chatCode: string }) => {
    const response = await httpClient.delete('/api/v1/chat-user/chatroom/remove', { data: payload });
    return response.data;
};
export const updateChatRoomApi = async (payload: UpdateChatRoomPayload) => {
    const res = await httpClient.put("/api/v1/chat-user/chatroom/update", payload);
    return res.data;
};
export const toggleChatRoomQuietStatusApi = async (payload: { chatCode: string; isQuiet: boolean }) => {
    const res = await httpClient.put("/api/v1/chat-user/chatroom/quiet-status", payload);
    return res.data;
};
export const transferAdminApi = async (payload: { chatCode: string; newAdminUserId: number }) => {
    const res = await httpClient.post("/api/v1/chat-user/chatroom/transfer-admin", payload);
    return res.data;
};

export const markAsReadMessageApi = async (payload: { chatCode: string , messageCode: string }) => {
    const res = await httpClient.post("/api/v1/chat-user/message/mark-read", payload);
    return res.data;
};