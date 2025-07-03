import React from "react";
import { AnimatePresence } from "framer-motion";
import ChatIntroMessage from "./ChatIntroMessage";
import ChatMessageItem from "./ChatMessageItem";
import BotIcon from "@/icons/logo/AI.svg?react";

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
};

type ChatMessageListProps = {
    allMessages: Message[];
    pendingMessages: Message[];
    topicType?: any;
    title?: string;
    loading?: boolean;
};

export const ChatMessageList: React.FC<ChatMessageListProps> = ({ allMessages, pendingMessages, topicType, title, loading }) => {
    console.log(allMessages)
    return (
        <div className="flex flex-col gap-8 mx-auto pt-8">
            <ChatIntroMessage topicType={topicType} />
            <AnimatePresence initial={false}>
                {allMessages.map((msg, idx) => {
                    let key: string | number = idx;
                    if (msg.id !== undefined && msg.id !== null) {
                        key = msg.id as string | number;
                    } else if (msg.createdAt !== undefined && msg.createdAt !== null) {
                        key = msg.createdAt instanceof Date ? msg.createdAt.getTime() : msg.createdAt as string | number;
                    }
                    return (
                        <ChatMessageItem key={key} msg={msg} isUser={!!msg.isRight} isError={msg?.isError} />
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