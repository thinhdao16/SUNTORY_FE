export interface ChatInfo {
    id: number;
    code: string;
    title: string;
    avatarRoomChat?: string | null;
    type: number;
    topic?: string | null;
    status: number;
    createDate: string;
    isFriend?: boolean | null;
    friendRequest?: any | null;
}

export interface Member {
    id: number;
    chatInfoId: number;
    userId: number;
    botInfoId: number | null;
    type: number;
    isQuiet: number;
    isAdmin: number;
    createDate: string;
    chatInfo: ChatInfo;
    user: any;
    botInfo: any;
}

export interface RoomChatInfo {
    id: number;
    code: string;
    title: string;
    avatarRoomChat: string;
    type: number;
    status: number;
    createDate: string;
    updateDate: string;
    unreadCount: number;
    lastMessageInfo: any;
    topic: any;
    chatInfo: ChatInfo | null;
}
export interface ChatAttachment {
    id: number;
    chatMessageId: number;
    fileUrl: string;
    fileName: string;
    fileType: number;
    fileSize: number;
    createDate: string;
    isUploading?: boolean;
    isError?: boolean;
    localUrl?: string;
    serverUrl?: string;

}

export interface ReplyToMessage {
    id: number;
    code: string;
    userId: number;
    messageText: string;
    messageType: number;
    senderType: number;
    hasAttachment: number;
    isRead: number;
    isRevoked: number;
    isEdited: number;
    replyToMessageId: number;
    status: number;
    chatInfoId: number;
    createDate: string;
    userName: string;
    userAvatar: string;
    chatAttachments: ChatAttachment[];
    reactions: any[];
}
// types/social-chat.ts

export interface ChatMessage {
    id: number;
    code: string;
    tempId?: string;
    userId: number;
    botInfoId?: number | null;
    messageText: string;
    messageType: number;
    senderType: number;
    hasAttachment: number;
    isRead: number;
    isRevoked: number;
    isEdited: number;
    unreadCount?: number;
    replyToMessageId?: number | null;
    replyToMessageCode?: string | null;
    status: number;
    chatInfoId: number;
    createDate: string;
    updateDate?:string;
    userName: string;
    botName?: string | null;
    userAvatar?: string | null;
    botAvatarUrl?: string | null;

    // Arrays và Objects
    chatAttachments: ChatAttachment[];
    chatInfo: ChatInfo | null;
    botInfo?: any | null;
    userChatMessage?: any | null;
    replyToMessage?: ChatMessage | null;
    reactions: any[];
    userHasRead?: Array<{
        userId: number;
        userName: string;
        userAvatar?: string | null;
        readTime: string;
    }>;

    // Custom fields for UI
    attachments?: any[]; // Compatibility field
    isRight?: boolean;
    timeStamp?: number;
    isPending?: boolean;
    isUploading?: boolean;
    isSend?: boolean;
    isError?: boolean;
    translatedText?: string; 
    isTranslating?: boolean;
}

// export interface PendingMessage {
//     id: number;
//     code?: string;
//     tempId?: string;
//     messageText: string;
//     messageType: number;
//     senderType: number;
//     userId: number;
//     userName?: string;
//     userAvatar?: string | null;
//     createDate: string;
//     timeStamp: number;
//     chatInfoId: number;
//     replyToMessageId?: number | null;
//     replyToMessageCode?: string | null;
//     status?: number;

//     // Attachments
//     attachments?: {
//         fileUrl: string;
//         fileName: string;
//         fileType: number;
//         createDate?: string;
//     }[];

//     // Server response fields
//     hasAttachment?: number;
//     isRead?: number;
//     isRevoked?: number;
//     isEdited?: number;
//     unreadCount?: number;

//     // Pending states
//     isSend?: boolean;
//     isError?: boolean;
// }
