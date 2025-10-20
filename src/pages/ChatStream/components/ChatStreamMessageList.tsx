/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import ChatMessageItem from "./ChatStreamMessageItem";
import BotIcon from "@/icons/logo/AI.svg?react";
import SparklesIcon from "@/icons/logo/AI_thinking.svg?react";
import ChatStreamIntroMessage from "./ChatStreamIntroMessage";
import ThinkingStatus from "./ThinkingStatus";
import { Skeleton } from "@/components/ui/Skeleton";
import { MessageState } from "@/types/chat-message";

type Attachment = {
    fileName: string;
    fileUrl: string;
};

type Message = {
    id?: string | number;
    timeStamp?: string | number;
    createdAt?: string | number | Date;
    isRight?: boolean;
    botName?: string;
    text?: string | object;
    attachments?: Attachment[];
    isError?: boolean;
    isSend?: boolean;
    isStreaming?: boolean;
    isComplete?: boolean;
    hasError?: boolean;
    isTyping?: boolean;
    partialText?: string;
    completeText?: string;
    chunks?: any[];
    messageState?: MessageState | string;
};

type ChatStreamMessageListProps = {
    allMessages: Message[];
    pendingMessages: Message[];
    topicType?: any;
    title?: string;
    loading?: boolean;
    isSpending?: boolean;
    lastPage: { hasMore: boolean } | null;
    thinkLoading?: boolean;
    scrollToBottom?: () => void;
    isLoadingMessages?: boolean;
};

export const ChatStreamMessageList: React.FC<ChatStreamMessageListProps & {
    onRetryMessage?: (msgId: string) => void;
    isLoadingMore?: boolean;
    isAtTop?: boolean;
}> = ({
    allMessages,
    pendingMessages,
    topicType,
    title,
    loading,
    onRetryMessage,
    isLoadingMore,
    isAtTop,
    isSpending,
    lastPage,
    thinkLoading,
    scrollToBottom,
    isLoadingMessages,
}) => {
        // const { text } = useSignalRStreamStore((s) => s.currentChatStream || { text: '' });
        const {
            completedMessages,
            streamingMessage,
            isWaitingForFirstChunk,
        } = useMemo(() => {
            let completed: Message[] = [];
            let streaming: Message | null = null;
            let waitingFirst = false;
            for (let i = allMessages.length - 1; i >= 0; i--) {
                const msg = allMessages[i];
                if (msg.isStreaming && !msg.isComplete && !streaming) {
                    let textStr = '';
                    if (typeof msg.text === 'string') {
                        textStr = msg.text;
                    } else if (msg.partialText) {
                        textStr = msg.partialText;
                    } else if (Array.isArray(msg.chunks)) {
                        textStr = msg.chunks.map(c => c.chunk).join('');
                    }

                    if (!textStr.trim()) {
                        waitingFirst = true;
                    } else {
                        streaming = msg;
                    }
                } else {
                    completed.unshift(msg);
                }
            }
            return {
                completedMessages: completed,
                streamingMessage: streaming,
                isWaitingForFirstChunk: waitingFirst,
            };
        }, [allMessages]);
        return (
            <div className="flex flex-col gap-6 mx-auto pt-8">
                {isLoadingMessages && allMessages.length === 0 && (
                    <div className="flex flex-col gap-4">
                        <Skeleton className="w-3/4 h-6" rounded="2xl"  />
                        <Skeleton className="w-2/3 h-6" rounded="2xl"  />
                        <Skeleton className="w-5/6 h-6" rounded="2xl"  />
                        <Skeleton className="w-1/2 h-6" rounded="2xl"  />
                    </div>
                )}
                {isLoadingMore && (
                    <div className="flex justify-center items-center py-4">
                        <div className="flex items-center gap-2 text-gray-500">
                            <div className="loader border-main border-t-transparent border-2 rounded-full w-4 h-4 animate-spin"></div>
                            <span className="text-sm">{t("Loading older messages...")}</span>
                        </div>
                    </div>
                )}
                {(!lastPage || lastPage.hasMore === false) && (
                    <ChatStreamIntroMessage topicType={topicType} />
                )}

                {allMessages.map((msg, idx) => {
                    const isUser = !!msg.isRight;
                    const isThisStreaming = msg.isStreaming && !msg.isComplete;
                    const isWaitingStreamForThis = !isUser && isThisStreaming && isWaitingForFirstChunk;
                    // While waiting for the first chunk, do NOT render the pending bot message (ThinkingStatus will represent it)
                    const isPendingBotMsg = !isUser && (
                        msg.text === MessageState.PENDING ||
                        msg.messageState === MessageState.PENDING ||
                        msg.messageState === "SENDING" ||
                        msg.text === 'PENDING_MESSAGE'
                    );
                    if (isWaitingStreamForThis || isPendingBotMsg) return null;
                    const hideAvatarForThis = false;
                    return (
                        <ChatMessageItem
                            key={
                                msg.id ??
                                (msg.createdAt instanceof Date
                                    ? msg.createdAt.getTime()
                                    : msg.createdAt) ??
                                idx
                            }
                            msg={msg}
                            isUser={isUser}
                            isError={msg.isError}
                            isSend={msg.isSend}
                            onRetryMessage={onRetryMessage}
                            isSpending={isSpending}
                            loading={loading}
                            hideAvatar={hideAvatarForThis}
                        />
                    );
                })}

                {/* {streamingMessage && (
                <StreamingMessageChunk msg={streamingMessage.completeText || ""} />
            )} */}
                {/* {streamingMessage && (
                <StreamingMessageItemComponent msg={streamingMessage} />
            )} */}
                {(isWaitingForFirstChunk || (loading && !streamingMessage)) && (
                    <motion.div
                        key="thinking-bubble"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        exit={{ scaleX: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        style={{ originX: 0 }}
                        className="flex w-full mb-4"
                    >
                        <div className="flex gap-2 items-start w-fit">
                            <BotIcon className="min-w-[30px] aspect-square object-contain" />
                            <ThinkingStatus scrollToBottom={scrollToBottom ?? (() => {})} />
                        </div>
                    </motion.div>
                )}
            </div>
        );
    };
