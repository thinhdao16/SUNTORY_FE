/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { AnimatePresence } from "framer-motion";
import ChatMessageItem from "./ChatStreamMessageItem";
import BotIcon from "@/icons/logo/AI.svg?react";
import ChatStreamIntroMessage from "./ChatStreamIntroMessage";

type Attachment = {
    fileName: string;
    fileUrl: string;
};

type Message = {
    id?: string | number;
    createdAt?: string | number | Date;
    isRight?: boolean;
    botName?: string;
    text?: string | object;
    attachments?: Attachment[];
    isError?: boolean;
    isSend?: boolean;
};

type ChatStreamMessageListProps = {
    allMessages: Message[];
    pendingMessages: Message[];
    topicType?: any;
    title?: string;
    loading?: boolean;
};

export const ChatStreamMessageList: React.FC<ChatStreamMessageListProps> = ({ allMessages, pendingMessages, topicType, title, loading }) => {
    return (
        <div className="flex flex-col gap-6 mx-auto pt-8">
            <ChatStreamIntroMessage topicType={topicType} />
            <AnimatePresence initial={false}>
                {allMessages.map((msg, idx) => {
                    let key: string | number = idx;
                    if (msg.id !== undefined && msg.id !== null) {
                        key = msg.id as string | number;
                    } else if (msg.createdAt !== undefined && msg.createdAt !== null) {
                        key = msg.createdAt instanceof Date ? msg.createdAt.getTime() : msg.createdAt as string | number;
                    }
                    return (
                        <ChatMessageItem key={key} msg={msg} isUser={!!msg.isRight} isError={msg?.isError} isSend={msg?.isSend} />
                    );
                })}
            </AnimatePresence>
            {pendingMessages.length > 0 && loading && (
                <div className="flex w-full mb-4">
                    <div className="flex gap-2 items-start w-fit">
                        <BotIcon className="min-w-[30px] aspect-square object-contain" />
                        <div className="flex-1 flex flex-col">
                            <div className="">
                                <span className="flex items-center gap-2 rounded-[16px_16px_16px_0px] bg-chat-to px-4 py-3">
                                    <span className="inline-flex space-x-1">
                                        <span
                                            className="w-2 h-2 bg-black rounded-full animate-[wave_1.2s_ease-in-out_infinite]"
                                            style={{ animationDelay: "0s" }}
                                        ></span>
                                        <span
                                            className="w-2 h-2 bg-black rounded-full animate-[wave_1.2s_ease-in-out_infinite]"
                                            style={{ animationDelay: "0.15s" }}
                                        ></span>
                                        <span
                                            className="w-2 h-2 bg-black rounded-full animate-[wave_1.2s_ease-in-out_infinite]"
                                            style={{ animationDelay: "0.3s" }}
                                        ></span>
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
};