import httpClient from "@/config/http-client";
import { CreateSocialChatMessagePayload, GetSocialChatMessagesParams, NotificationCounts, RevokeSocialChatMessagePayload, UpdateSocialChatMessagePayload } from "./social-chat-type";

export const getUserChatRooms = async (params: { PageNumber?: number; PageSize?: number; Keyword?: string } = {}) => {
    const { PageNumber = 0, PageSize = 100, Keyword } = params;
    const res = await httpClient.get(`api/v1/chat-user/chatrooms`, {
        params: { PageNumber, PageSize, Keyword },
    });
    return res.data?.data?.data || [];
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