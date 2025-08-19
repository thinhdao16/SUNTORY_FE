/* eslint-disable @typescript-eslint/no-explicit-any */
import { generatePreciseTimestampFromDate } from "@/utils/time-stamp";

function getDisplayTextForStreaming(chunks: any[], completeText: string, isComplete: boolean): string {
    if (isComplete && completeText) {
        return completeText;
    }

    const accumulated = chunks.map((chunk: any) => chunk.chunk).join('');
    return accumulated;
}

export function mapSignalRStreamMessage(
    msg: any,
    pendingMessages: any[],
    pendingImages: string[],
    pendingFiles: {
        name: string;
        url: string;
    }[]

) {
    if (msg.chunks && Array.isArray(msg.chunks)) {
        const displayText = getDisplayTextForStreaming(msg.chunks, msg.completeText, msg.isComplete);

        return [{
            id: msg.id,
            text: displayText,
            isRight: false,
            createdAt: generatePreciseTimestampFromDate(msg.startTime || new Date().toISOString()),
            timeStamp: generatePreciseTimestampFromDate(msg.startTime || new Date().toISOString()),
            senderType: 20,
            messageType: 1,
            userName: null,
            botName: "AI Assistant",
            userAvatar: null,
            botAvatarUrl: null,
            attachments: [],
            replyToMessageId: null,
            status: msg.isComplete ? 1 : 0,
            chatInfoId: null,
            chatCode: msg.chatCode,
            messageCode: msg.messageCode,
            isStreaming: msg.isStreaming && !msg.isComplete,
            isComplete: msg.isComplete,
            hasError: msg.hasError,
            chunks: msg.chunks,
            isTyping: msg.isStreaming && !msg.isComplete && displayText.length === 0,
            partialText: msg.chunks.map((chunk: any) => chunk.chunk).join(''),
            completeText: msg.completeText,
        }];
    }

    const base = {
        id: msg.id?.toString(),
        text: msg.messageText,
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
            text: msg.userChatMessage.messageText,
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

export function mergeMessagesStream(
    messages: any[],
    signalRMessages: any[],
    pendingMessages: any[],
    pendingImages: string[],
    pendingFiles: { name: string; url: string }[]
) {
    const allSignalR = signalRMessages.map((msg: any) => {
        if (msg.chunks && Array.isArray(msg.chunks)) {
            const displayText = getDisplayTextForStreaming(msg.chunks, msg.completeText, msg.isComplete);
            return {
                id: msg.id,
                text: displayText,
                isRight: false,
                createdAt: generatePreciseTimestampFromDate(msg.startTime || new Date().toISOString()),
                timeStamp: generatePreciseTimestampFromDate(msg.startTime || new Date().toISOString()),
                senderType: 20,
                messageType: 1,
                userName: null,
                botName: "AI Assistant",
                userAvatar: null,
                botAvatarUrl: null,
                attachments: [],
                replyToMessageId: null,
                status: msg.isComplete ? 1 : 0,
                chatInfoId: null,
                chatCode: msg.chatCode,
                messageCode: msg.messageCode,
                isStreaming: msg.isStreaming && !msg.isComplete,
                isComplete: msg.isComplete,
                hasError: msg.hasError,
                chunks: msg.chunks,
                isTyping: msg.isStreaming && !msg.isComplete && displayText.length === 0,
                partialText: msg.chunks.map((c: any) => c.chunk).join(''),
                completeText: msg.completeText,
            };
        }
        return mapSignalRStreamMessage(msg, pendingMessages, pendingImages, pendingFiles)[0];
    });
    const allPending = pendingMessages.map(mapPendingMessage);

    const uniqueSignalR = allSignalR.filter((msg: any, index: number) => {
        if (msg.isComplete) return true;

        const msgId = msg.id || msg.messageCode;
        if (!msgId) return true;

        const isDupWithExisting = messages.some((m: any) =>
            (m.id && m.id === msgId) ||
            (m.messageCode && msg.messageCode && msg.messageCode === msg.messageCode)
        );

        const isDupWithinSignalR = allSignalR.slice(0, index).some((prev: any) =>
            prev.messageCode === msg.messageCode ||
            (typeof prev.text === 'string' &&
                prev.text.trim() === (msg.text as string).trim() &&
                msg.text.length > 10)
        );

        return !isDupWithExisting && !isDupWithinSignalR;
    });

    const completedSignalR = uniqueSignalR.filter((m: any) => m.isComplete);
    const streamingSignalR = uniqueSignalR.filter((m: any) => m.isStreaming && !m.isComplete);

    const merged = [
        ...messages,
        ...completedSignalR,
        ...allPending,
        ...streamingSignalR
    ];
    // console.log(merged)
    return merged.sort((a, b) => {
        const rawA = a.id, rawB = b.id;
        const numA = Number(rawA);
        const numB = Number(rawB);
        const aIsNum = !isNaN(numA);
        const bIsNum = !isNaN(numB);
        if (aIsNum && bIsNum) {
            return numA - numB;
        } else if (aIsNum) {
            return -1;
        } else if (bIsNum) {
            return 1;
        } else {
            return String(rawA).localeCompare(String(rawB));
        }
    });

}