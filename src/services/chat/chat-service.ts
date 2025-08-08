/* eslint-disable @typescript-eslint/no-explicit-any */
import httpClient from "@/config/http-client";
import { ChatHistoryLastModuleItem, ChatHistoryLastModuleResponse, CreateChatPayload, CreateChatStreamPayload, UserChatByTopicResponse } from "./chat-types";
import { ChatMessage } from "@/pages/Chat/hooks/useChatMessages";
import { generatePreciseTimestampFromDate } from "@/utils/time-stamp";

export const USER_SENDER_TYPE = 10;

export interface UserChatByTopicRequest {
    topicId: number | null;
}
export const getUserChatsByTopic = async (
    topicId?: number | null,
    keyword?: string
) => {
    const res = await httpClient.get<UserChatByTopicResponse>(
        "/api/v1/chat/user-chats-by-topic",
        { params: { topic: topicId, keyword } }
    );
    return res.data;
};

export async function createChatApi(payload: CreateChatPayload) {
    const res = await httpClient.post("/api/v1/chat/create", payload);
    return res.data;
}
export async function createChatStreamApi(payload: CreateChatStreamPayload) {
    const res = await httpClient.post("/api/v1/chat/create-stream", payload);
    return res.data;
}
export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    const res = await httpClient.get("/api/v1/chat/messages", {
        params: {
            chatCode: sessionId,
            PageNumber: 1000,
            PageSize: 0,
        },
    });
    const data = res.data?.data?.data || [];
    return data.map((msg: any) => ({
        id: msg.id?.toString(),
        text: msg.messageText,
        isRight: msg.senderType === USER_SENDER_TYPE,
        createdAt: msg.createDate,
        timeStamp: generatePreciseTimestampFromDate(msg.createDate),
        senderType: msg.senderType,
        messageType: msg.messageType,
        userName: msg.userName,
        botName: msg.botName,
        userAvatar: msg.userAvatar,
        botAvatarUrl: msg.botAvatarUrl,
        attachments: msg.chatAttachments,
        replyToMessageId: msg.replyToMessageId,
        status: msg.status,
        chatInfoId: msg.chatInfoId,
        chatCode: msg.code,
    }));
}
export async function getChatHistoryModule(topicId: number): Promise<ChatHistoryLastModuleItem[]> {
    const res = await httpClient.get<ChatHistoryLastModuleResponse>("/api/v1/chat/history", { params: { topic: topicId } });
    return res.data?.data || [];
}
export async function getChatMessage(chatCode: string): Promise<ChatMessage[]> {
    const res = await httpClient.get(`/api/v1/chat/message/${chatCode}`, {
    });
    const data = res.data?.data || [];
    const messages = Array.isArray(data) ? data : [data];
    return messages.map((msg: any) => ({
        id: msg.id?.toString(),
        text: msg.messageText,
        isRight: msg.senderType === 10,
        createdAt: msg.createDate,
        timeStamp: Number(new Date(msg.createDate)),
        senderType: msg.senderType,
        messageType: msg.messageType,
        userName: msg.userName,
        botName: msg.botName,
        userAvatar: msg.userAvatar,
        botAvatarUrl: msg.botAvatarUrl,
        attachments: msg.chatAttachments,
        replyToMessageId: msg.replyToMessageId,
        status: msg.status,
        chatInfoId: msg.chatInfoId,
        chatCode: msg.chatInfo.code,
    }));
}