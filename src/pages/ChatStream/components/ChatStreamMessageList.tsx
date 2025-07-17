/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import ChatMessageItem from "./ChatStreamMessageItem";
import StreamingMessageItemComponent from "./StreamingMessageItem";
import BotIcon from "@/icons/logo/AI.svg?react";
import ChatStreamIntroMessage from "./ChatStreamIntroMessage";
import styles from "./StreamingMessage.module.css";

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
};

type ChatStreamMessageListProps = {
    allMessages: Message[];
    pendingMessages: Message[];
    topicType?: any;
    title?: string;
    loading?: boolean;
};

export const ChatStreamMessageList: React.FC<ChatStreamMessageListProps & {
    onRetryMessage?: (msgId: string) => void;
}> = ({ allMessages, pendingMessages, topicType, title, loading, onRetryMessage }) => {
    const { completedMessages, streamingMessage, isTyping } = useMemo(() => {
        let completed: any[] = [];
        let streaming: any = null;
        let typing = false;

        if (allMessages.length > 0) {
            for (let i = allMessages.length - 1; i >= 0; i--) {
                const msg = allMessages[i];

                if (msg.isStreaming && !msg.isComplete && !streaming) {
                    let textStr = '';
                    if (typeof msg.text === 'string') {
                        textStr = msg.text;
                    } else if (msg.partialText) {
                        textStr = msg.partialText;
                    } else if (msg.chunks && Array.isArray(msg.chunks)) {
                        textStr = msg.chunks.map((chunk: any) => chunk.chunk).join('');
                    }

                    if (!textStr || textStr.trim() === '') {
                        typing = true;
                    } else {
                        streaming = msg;
                    }
                } else {
                    completed.unshift(msg);
                }
            }
        }

        return {
            completedMessages: completed,
            streamingMessage: streaming,
            isTyping: typing
        };
    }, [allMessages]);
    return (
        <div className="flex flex-col gap-6 mx-auto pt-8">
            <ChatStreamIntroMessage topicType={topicType} />
            <AnimatePresence initial={false}>
                {completedMessages.map((msg, idx) => {
                    let key: string | number = idx;
                    if (msg.id !== undefined && msg.id !== null) {
                        key = msg.id as string | number;
                    } else if (msg.createdAt !== undefined && msg.createdAt !== null) {
                        key = msg.createdAt instanceof Date ? msg.createdAt.getTime() : msg.createdAt as string | number;
                    }
                    return (
                        <ChatMessageItem
                            key={key}
                            msg={msg}
                            isUser={!!msg.isRight}
                            isError={msg?.isError}
                            isSend={msg?.isSend}
                            onRetryMessage={onRetryMessage}
                        />
                    );
                })}

                {isTyping && (
                    <div className="flex w-full mb-4">
                        <div className="flex gap-2 items-start w-fit">
                            <BotIcon className="min-w-[30px] aspect-square object-contain" />
                            <div className="flex-1 flex flex-col">
                                <div className="">
                                    <span className="flex items-center gap-2 rounded-[16px_16px_16px_0px] bg-screen-page px-4 py-3">
                                        <div className={styles.typingIndicator}>
                                            <div className={styles.typingDot}></div>
                                            <div className={styles.typingDot}></div>
                                            <div className={styles.typingDot}></div>
                                        </div>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {streamingMessage && <StreamingMessageItemComponent msg={streamingMessage} />}
            </AnimatePresence>
        </div>
    )
};