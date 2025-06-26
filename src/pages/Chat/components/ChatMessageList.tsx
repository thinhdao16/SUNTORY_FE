import React from "react";
import { handleImageError } from "@/utils/image-utils";
import { generatePreciseTimestampFromDate } from "@/utils/time-stamp";
import PendingFileItem from "@/components/common/PendingFileItem";
import { getFileIconAndLabel } from "@/utils/fileTypeUtils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TopicType } from "@/constants/topicType";
import { AnimatePresence, motion } from "framer-motion";
import ChatIntroMessage from "./ChatIntroMessage";
import ChatMessageItem from "./ChatMessageItem";

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
};

type ChatMessageListProps = {
    allMessages: Message[];
    pendingMessages: Message[];
    topicType?: any;
    title?: string;
    loading?: boolean;
};

export const ChatMessageList: React.FC<ChatMessageListProps> = ({ allMessages, pendingMessages, topicType, title, loading }) => {
    return (
        <div className="flex flex-col gap-8 max-w-[370px] mx-auto pt-8">
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
                        <ChatMessageItem key={key} msg={msg} isUser={!!msg.isRight} />
                    );
                })}
            </AnimatePresence>
            {pendingMessages.length > 0 && loading && (
                <div className="flex w-full mb-4">
                    <div className="flex gap-2 items-start w-fit">

                        <div className="flex-1 flex flex-col">
                            <div className=" px-4 py-3">
                                <span className="flex items-center gap-2 rounded-[16px_16px_16px_0px]  bg-chat-to px-4 py-3">
                                    <span className="inline-flex space-x-1 animate-pulse">
                                        <span className="w-2 h-2 bg-black rounded-full"></span>
                                        <span className="w-2 h-2 bg-black rounded-full"></span>
                                        <span className="w-2 h-2 bg-black rounded-full"></span>
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