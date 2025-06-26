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
}
