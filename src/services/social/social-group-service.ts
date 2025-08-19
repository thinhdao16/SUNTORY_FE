import httpClient from "@/config/http-client";

export interface CreateGroupPayload {
    title: string;
    userIds: number[];
}

export const createChatGroup = async (payload: CreateGroupPayload) => {
    const res = await httpClient.post("/api/v1/chat-user/chatroom/create", payload);
    return res.data.data;
};