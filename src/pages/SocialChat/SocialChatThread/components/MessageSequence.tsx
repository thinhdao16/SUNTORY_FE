import React from "react";
import ChatMessageItem from "./ChatMessageItem";
import { ChatMessage } from "@/types/social-chat";

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
}) => {

    return (
        <div className="flex flex-col">
            {messages.map((msg, idx) => {
                const isUser = !!msg._isUser || !!msg.isRight;
                const shouldShowAvatar = msg._shouldShowAvatar !== false;
                const isFirstInSequence = msg._isFirstInSequence !== false;
                const messageCode = msg.code ?? msg.tempId ?? `${idx}`;
                const isLastUserMessage = isUser && (
                    messageCode === globalLastUserMessageId 
                );

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
                            isSendingMessage={isSendingMessage}
                            activeUserIds={activeUserIds}
                        />
                    </div>
                );
            })}
        </div>
    );
};