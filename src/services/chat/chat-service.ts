import httpClient from "@/config/http-client";
import { CreateChatPayload, UserChatByTopicResponse } from "./chat-types";
import { ChatMessage } from "@/pages/Chat/hooks/useChatMessages";
import { generatePreciseTimestampFromDate } from "@/utils/time-stamp";

export const USER_SENDER_TYPE = 10;

export interface UserChatByTopicRequest {
    topicId: number | null;
}
export const getUserChatsByTopic = async (topicId?: number | null) => {
    const res = await httpClient.get<UserChatByTopicResponse>(
        "/api/v1/chat/user-chats-by-topic",
        { params: { topicId } }
    );
    return res.data;
};
export async function createChatApi(payload: CreateChatPayload) {
    const res = await httpClient.post("/api/v1/chat/create", payload);
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
        text: msg.massageText,
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
