export interface CreateSocialChatMessagePayload {
    chatCode: string | null;
    messageText: string;
    files?: { name: string }[];
    replyToMessageCode?: string | null;
    tempId: string | null;
}
export interface GetSocialChatMessagesParams {
    chatCode: string;
    keyword?: string;
    PageNumber: number;
    PageSize: number;
}

export interface UpdateSocialChatMessagePayload {
    messageCode: string;
    messageText: string;
}
export interface RevokeSocialChatMessagePayload {
    messageCode: string;
}
export interface NotificationCounts {
    userId: number;
    unreadRoomsCount: number;
    pendingFriendRequestsCount: number;
}