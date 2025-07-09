import { generatePreciseTimestampFromDate } from "@/utils/time-stamp";

export function mapSignalRMessage(
    msg: any,
    pendingMessages: any[],
    pendingImages: string[],
    pendingFiles: {
        name: string;
        url: string;
    }[]

) {
    const base = {
        id: msg.id?.toString(),
        text: msg.massageText,
        isRight: msg.senderType === 10,
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
    };

    if (msg.userChatMessage) {
        const userMsg = {
            id: msg.userChatMessage.id?.toString(),
            text: msg.userChatMessage.massageText,
            isRight: true,
            createdAt: msg.userChatMessage.createDate,
            timeStamp: generatePreciseTimestampFromDate(msg.userChatMessage.createDate),
            senderType: 10,
            messageType: msg.userChatMessage.messageType,
            userName: msg.userChatMessage.userName,
            botName: null,
            userAvatar: msg.userChatMessage.userAvatar,
            botAvatarUrl: null,
            attachments: msg.userChatMessage.chatAttachments,
            replyToMessageId: msg.userChatMessage.replyToMessageId,
            status: msg.userChatMessage.status,
            chatInfoId: msg.userChatMessage.chatInfoId,
            chatCode: msg.userChatMessage.code,
        };

        const isDuplicate =
            pendingMessages.some((pending: any) =>
                (pending.id && userMsg.id && pending.id === userMsg.id) ||
                (pending.chatCode && userMsg.chatCode && pending.chatCode === userMsg.chatCode) ||
                (pending.text && userMsg.text && pending.text.trim() === userMsg.text.trim()) ||
                // Check attachments in pending messages
                (pending.attachments &&
                    pending.attachments.some(
                        (att: any) =>
                            userMsg.attachments?.[0]?.fileUrl &&
                            att.fileUrl === userMsg.attachments[0].fileUrl
                    ))
            ) ||
            pendingImages.some(
                (imgUrl: string) =>
                    userMsg.attachments?.[0]?.fileUrl &&
                    imgUrl === userMsg.attachments[0].fileUrl
            ) ||
            pendingFiles.some(
                (file: { name: string; url: string }) =>
                    userMsg.attachments?.[0]?.fileUrl &&
                    file.url === userMsg.attachments[0].fileUrl
            );

        return isDuplicate ? [base] : [userMsg, base];
    }
    return [base];
}

export function mapPendingMessage(msg: any) {
    return { ...msg, isRight: true };
}

export function mergeMessages(
    messages: any[],
    signalRMessages: any[],
    pendingMessages: any[],
    pendingImages: string[],
    pendingFiles: { name: string; url: string }[]
) {
    const allSignalR = signalRMessages.flatMap((msg: any) =>
        mapSignalRMessage(msg, pendingMessages, pendingImages, pendingFiles)
    );
    const allPending = pendingMessages.map(mapPendingMessage);
    return [
        ...messages,
        ...allSignalR.filter((msg: any) =>
            !messages.some(
                (m: any) =>
                    (m.id && msg.id && m.id === msg.id) ||
                    (m.chatCode && msg.chatCode && m.chatCode === msg.chatCode)
            )
        ),
        ...allPending,
    ].sort((a, b) => a.timeStamp - b.timeStamp);
}