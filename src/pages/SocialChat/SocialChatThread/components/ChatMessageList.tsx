import React, { useMemo } from "react";
import ChatMessageItem from "./ChatMessageItem";
import BotIcon from "@/icons/logo/AI.svg?react";
import { ChatMessage } from "@/types/social-chat";

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
    timeStamp?: number;
    createDate?: string;
    isEdited?: number;
    isRevoked?: number;
    isReply?: number;
    replyToMessageId?: string | number | null;
};

type ChatMessageListProps = {
    allMessages: Message[];
    loading?: boolean;
    onEditMessage?: (messageCode: string | number, messageText: string) => void;
    onRevokeMessage: (messageCode: string | number) => void;
    onReplyMessage: (message: ChatMessage) => void;
};

export const ChatMessageList: React.FC<ChatMessageListProps> = ({ allMessages, loading, onEditMessage, onRevokeMessage, onReplyMessage }) => {
    const sortedMessages = useMemo(() => {
        return [...allMessages].sort((a, b) => {
            const aTime = a.timeStamp || (a.createDate ? new Date(a.createDate).getTime() : 0);
            const bTime = b.timeStamp || (b.createDate ? new Date(b.createDate).getTime() : 0);
            return aTime - bTime;
        });
    }, [allMessages]);
    return (
        <div className="flex flex-col gap-6 mx-auto pt-8">
            {sortedMessages.map((msg, idx) => {
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
                        onEditMessage={onEditMessage ?? (() => { })}
                        onRevokeMessage={onRevokeMessage ?? (() => { })}
                        isEdited={msg.isEdited === 1}
                        isRevoked={msg.isRevoked === 1}
                        onReplyMessage={onReplyMessage}
                        isReply={msg.replyToMessageId !== undefined && msg.replyToMessageId !== null}
                    />
                );
            })}
            {allMessages.length > 0 && loading && (
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
    );
};