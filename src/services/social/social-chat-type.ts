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
export interface AddGroupMembersPayload {
    chatCode: string;
    userIds: number[];
}
export interface UseAddGroupMembersOptions {
    onSuccess?: (data: any, variables: AddGroupMembersPayload) => void;
    onError?: (error: any) => void;
}
export interface RemoveGroupMembersPayload {
    chatCode: string;
    userIds: number[];
}
export interface UseRemoveGroupMembersOptions {
    onSuccess?: (data: any, variables: RemoveGroupMembersPayload) => void;
    onError?: (error: any) => void;
}
export interface UpdateChatRoomPayload {
    chatCode: string;
    title?: string;
    avatarRoomChat?: string;
    userIds?: number[];
}
