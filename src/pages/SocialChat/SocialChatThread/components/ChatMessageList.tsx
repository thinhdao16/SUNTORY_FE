import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import BotIcon from "@/icons/logo/AI.svg?react";
import { ChatMessage } from "@/types/social-chat";
import { groupMessagesByTime } from "@/utils/group-messages-by-time";
import { TimeGroupHeader } from "./TimeGroupHeader";
import { MessageSequence } from "./MessageSequence";

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
    userId?: number;
    _shouldShowAvatar?: boolean;
    _isFirstInSequence?: boolean;
};

type ChatMessageListProps = {
    allMessages: Message[];
    loading?: boolean;
    onEditMessage?: (messageCode: string | number, messageText: string) => void;
    onRevokeMessage: (messageCode: string | number) => void;
    onReplyMessage: (message: ChatMessage) => void;
    isGroup?: boolean;
    currentUserId?: number | string | null;
};

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
    allMessages,
    loading,
    onEditMessage,
    onRevokeMessage,
    onReplyMessage,
    isGroup = false,
    currentUserId = null,
}) => {
    const { t } = useTranslation();

    const messageGroups = useMemo(() => {
        return groupMessagesByTime(allMessages, t, { isGroup, currentUserId });
    }, [allMessages, t, isGroup, currentUserId]);
    return (
        <div className="flex flex-col mx-auto pt-8">
            {messageGroups.map((group, groupIndex) => (
                <div key={group.timestamp} className="mb-6">
                    {(messageGroups.length > 1 || groupIndex === 0) && (
                        <TimeGroupHeader displayTime={group.displayTime} />
                    )}

                    <MessageSequence
                        messages={group.messages}
                        onEditMessage={onEditMessage}
                        onRevokeMessage={onRevokeMessage}
                        onReplyMessage={onReplyMessage}
                        isGroup={isGroup}
                    />
                </div>
            ))}

            {allMessages.length > 0 && loading && (
                <div className="flex w-full mb-4 mt-6 px-6">
                    <div className="flex gap-2 items-start w-fit">
                        <BotIcon className="min-w-[30px] aspect-square object-contain" />
                        <div className="flex-1 flex flex-col">
                            <div className="">
                                <span className="flex items-center gap-2 rounded-[16px_16px_16px_0px] bg-gray-100 px-4 py-3">
                                    <span className="inline-flex space-x-1">
                                        <span
                                            className="w-2 h-2 bg-gray-400 rounded-full animate-[wave_1.2s_ease-in-out_infinite]"
                                            style={{ animationDelay: "0s" }}
                                        ></span>
                                        <span
                                            className="w-2 h-2 bg-gray-400 rounded-full animate-[wave_1.2s_ease-in-out_infinite]"
                                            style={{ animationDelay: "0.15s" }}
                                        ></span>
                                        <span
                                            className="w-2 h-2 bg-gray-400 rounded-full animate-[wave_1.2s_ease-in-out_infinite]"
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