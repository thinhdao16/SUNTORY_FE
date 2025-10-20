/* eslint-disable @typescript-eslint/no-explicit-any */
export interface UserChatItem {
    id: number;
    code: string;
    title: string;
    type: number;
    topic: number;
    status: number;
    createDate: string;
}

export interface UserChatByTopicResponse {
    data: UserChatItem[];
}
export interface CreateChatPayload {
    chatCode: string | null;
    messageText: string;
    topic: number;
    files?: { name: string }[];
    language: string;
}
export interface CreateChatStreamPayload {
    chatCode: string | null;
    messageText: string;
    topic: number;
    files?: { name: string }[];
    language: string;
    deviceId: string | null;
}
export interface ChatHistoryLastModuleItem {
    id: number;
    code: string;
    title: string;
    type: number;
    topic: number;
    status: number;
    createDate: string;
    updateDate: string | null;
    lastMessage: string;
    lastMessageDate: string;
    lastMessageUserId: number | null;
    lastMessageSenderType: string;
}
export interface ChatHistoryLastModuleResponse {
    result: number;
    errors: any;
    message: string;
    data: ChatHistoryLastModuleItem[];
}