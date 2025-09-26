import React from "react";
import ChatMessageItem from "./ChatMessageItem";
import { ChatMessage } from "@/types/social-chat";
import { SystemMessageType } from "@/constants/socialChat";

interface MessageSequenceProps {
    messages: any[];
    onEditMessage?: (messageCode: string | number, messageText: string) => void;
    onRevokeMessage: (messageCode: string | number) => void;
    onReplyMessage: (message: ChatMessage) => void;
    isGroup?: boolean;
    currentUserId?: number | string | null;
    hasReachedLimit?: boolean;
    globalLastUserMessageId?: string | number | null;
    isSendingMessage?: boolean;
    activeUserIds?: number[];
    allMessages?: any[];
    roomData?: any;
}

export const MessageSequence: React.FC<MessageSequenceProps> = ({
    messages,
    onEditMessage,
    onRevokeMessage,
    onReplyMessage,
    isGroup = false,
    currentUserId = null,
    hasReachedLimit = false,
    globalLastUserMessageId = null,
    isSendingMessage = false,
    activeUserIds = [],
    allMessages = [],
    roomData,
}) => {
    const latestFriendlyAcceptedIndex = allMessages.reduce((latestIdx, msg, idx) => {
        if (msg.messageType === 10 && msg.messageText) {
            try {
                const parsedMessage = JSON.parse(msg.messageText);
                if (parsedMessage.Event === "NOTIFY_FRIENDLY_ACCEPTED") {
                    return idx;
                }
            } catch (e) {
            }
        }
        return latestIdx;
    }, -1);
    const latestFriendlyAcceptedCode = latestFriendlyAcceptedIndex >= 0 
        ? (allMessages[latestFriendlyAcceptedIndex]?.code ?? allMessages[latestFriendlyAcceptedIndex]?.tempId)
        : null;
    return (
        <div className="flex flex-col">
            {messages.map((msg, idx) => {
                const isUser = !!msg._isUser || !!msg.isRight;
                const shouldShowAvatar = msg._shouldShowAvatar !== false;
                const isFirstInSequence = msg._isFirstInSequence !== false;
                const messageCode =  msg.tempId ?? msg.code ??`${idx}`;
                const isLastUserMessage = isUser && (
                    messageCode === globalLastUserMessageId 
                );
                
                const isLastMessageInConversation = allMessages.length > 0 && 
                    messageCode === (allMessages[allMessages.length - 1]?.code ?? allMessages[allMessages.length - 1]?.tempId);
                
                const isLatestFriendlyAccepted = latestFriendlyAcceptedCode && 
                    messageCode === latestFriendlyAcceptedCode;

                const key = messageCode;

                return (
                    <div key={key} className={`${!isFirstInSequence ? "mt-1" : "mt-3"}`}>
                        <ChatMessageItem
                            msg={{
                                ...msg,
                                _shouldShowAvatar: shouldShowAvatar,
                                _isFirstInSequence: isFirstInSequence,
                                _showSenderName: msg._showSenderName,
                            }}
                            isUser={isUser}
                            isError={msg?.isError}
                            isSend={msg?.isSend}
                            onEditMessage={onEditMessage ?? (() => { })}    
                            onRevokeMessage={onRevokeMessage ?? (() => { })}
                            onReplyMessage={onReplyMessage}
                            isEdited={msg.isEdited === 1}
                            isRevoked={msg.isRevoked === 1}
                            isReply={msg.replyToMessageId !== undefined && msg.replyToMessageId !== null}
                            isGroup={isGroup}
                            currentUserId={currentUserId}
                            hasReachedLimit={hasReachedLimit || false}
                            isLastUserMessage={isLastUserMessage}
                            isLastMessageInConversation={isLastMessageInConversation}
                            isSendingMessage={isSendingMessage}
                            activeUserIds={activeUserIds}
                            isLatestFriendlyAccepted={isLatestFriendlyAccepted}
                            roomData={roomData}
                        />
                    </div>
                );
            })}
        </div>
    );
};