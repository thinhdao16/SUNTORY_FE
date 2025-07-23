/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ChatMessageItem from "./ChatStreamMessageItem";
import StreamingMessageItemComponent from "./StreamingMessageItem";
import BotIcon from "@/icons/logo/AI.svg?react";
import SparklesIcon from "@/icons/logo/AI_thinking.svg?react";
import ChatStreamIntroMessage from "./ChatStreamIntroMessage";
import styles from "./StreamingMessage.module.css";
import { useSignalRStreamStore } from "@/store/zustand/signalr-stream-store";
import StreamingMessageChunk from "./StreamingMessageChunk";

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
    const { text } = useSignalRStreamStore((s) => s.currentChatStream || { text: '' });
    console.log(text);
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
            <ChatStreamIntroMessage topicType={topicType} />
            {/* <AnimatePresence initial={false}> */}
            {completedMessages.map((msg, idx) => (
                <ChatMessageItem
                    key={
                        msg.id ??
                        (msg.createdAt instanceof Date
                            ? msg.createdAt.getTime()
                            : msg.createdAt) ??
                        idx
                    }
                    msg={msg}
                    isUser={!!msg.isRight}
                    isError={msg.isError}
                    isSend={msg.isSend}
                    onRetryMessage={onRetryMessage}
                />
            ))}
            {streamingMessage && (
                <StreamingMessageItemComponent msg={streamingMessage} />
            )}
            {/* {streamingMessage && (
                <StreamingMessageChunk msg={text} />
            )} */}
            {isWaitingForFirstChunk && (
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
                        <div className="flex-1">
                            <div
                                className="
          inline-flex items-center gap-2
          bg-white/30 backdrop-blur-sm
          px-4 py-3
          rounded-tl-0 rounded-tr-[16px]
          rounded-bl-[16px] rounded-br-[16px]
        "
                            >
                                <SparklesIcon className="w-5 h-5 text-blue-400" />
                                <motion.span
                                    className="font-medium text-gray-700 relative -top-1"
                                    initial={{ opacity: 0.2 }}
                                    animate={{ opacity: 0.8 }}
                                    transition={{
                                        duration: 1.2,
                                        repeat: Infinity,
                                        repeatType: 'reverse',
                                        ease: 'easeInOut',
                                    }}
                                >
                                    Thinking…
                                </motion.span>
                            </div>
                        </div>
                    </div>
                </motion.div>


            )}
            {loading && !isWaitingForFirstChunk && !streamingMessage && (
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
                        <div className="flex-1">
                            <div
                                className="
          inline-flex items-center gap-2
          bg-white/30 backdrop-blur-sm
          px-4 py-3
          rounded-tl-0 rounded-tr-[16px]
          rounded-bl-[16px] rounded-br-[16px]
        "
                            >
                                <SparklesIcon className="w-5 h-5 text-blue-400" />
                                <motion.span
                                    className="font-medium text-gray-700 relative -top-1"
                                    initial={{ opacity: 0.2 }}
                                    animate={{ opacity: 0.8 }}
                                    transition={{
                                        duration: 1.2,
                                        repeat: Infinity,
                                        repeatType: 'reverse',
                                        ease: 'easeInOut',
                                    }}
                                >
                                    Thinking…
                                </motion.span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
            {/* </AnimatePresence> */}
        </div>
    );
};
