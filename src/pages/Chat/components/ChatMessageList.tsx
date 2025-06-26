import React from "react";
import { handleImageError } from "@/utils/image-utils";
import { generatePreciseTimestampFromDate } from "@/utils/time-stamp";
import PendingFileItem from "@/components/common/PendingFileItem";
import { getFileIconAndLabel } from "@/utils/fileTypeUtils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TopicType } from "@/constants/topicType";
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
            {topicType !== TopicType.Chat && (
                <div>
                    <div className="flex gap-2 w-full max-w-[90%]">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                            <img src="/logo/AI.svg" alt="bot" />
                        </div>
                        <div className="bg-chat-to rounded-[16px_16px_16px_0px] px-4 py-3 text-[15px] text-gray-700">
                            {t("Instructions for use")} <span className="text-main font-medium">{title}</span>
                        </div>
                    </div>
                    <hr className="border-netural-100 mt-6 mb-12 h-[0.52px]" />
                    <div className="flex gap-2 w-full max-w-[90%]">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                            <img src="/logo/AI.svg" alt="bot" />
                        </div>
                        <div className="bg-chat-to rounded-[16px_16px_16px_0px] px-4 py-3 text-[15px] text-gray-700 whitespace-pre-line">
                            {t("What is WAYJET?")}
                            <br />
                            {t("An artificial intelligence (AI) tool that can:")}
                            <br />
                            {t("Interpret drug texts")}
                            <br />
                            {t("Translate documents")}
                            <br />
                            {t("Interpret drug ingredients")}
                            <br />
                            {t("Interpret food ingredients")}
                        </div>
                    </div>
                </div>
            )}
            {allMessages.map((msg, idx) => {
                const isUser = msg.isRight;
                return (
                    <div
                        key={typeof msg.id === "string" || typeof msg.id === "number" ? msg.id : String(msg.createdAt)}
                        className={`flex w-full mb-4 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                        <div className={`flex  gap-2 ${isUser ? "flex-row-reverse" : ""} items-start w-fit max-w-[95%]`}>
                            {!isUser && (
                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                                    <img src="/logo/AI.svg" alt="bot" />
                                </div>
                            )}
                            <div className="flex-1 flex flex-col">
                                {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2 justify-end ">
                                        {msg.attachments.map((file: any, fileIdx: number) => {
                                            const fileName = typeof file.fileName === "string" ? file.fileName : "";
                                            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                                            if (isImage) {
                                                return (
                                                    <a key={fileIdx} href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                                                        <img
                                                            src={file.fileUrl}
                                                            alt={fileName}
                                                            className="w-[200px] aspect-square object-cover rounded-xl "
                                                            onError={(e) => handleImageError(e, "/public/temp_logo.png")}
                                                        />
                                                    </a>
                                                );
                                            }
                                            const { icon, label } = getFileIconAndLabel(fileName);
                                            return (
                                                <PendingFileItem
                                                    key={fileIdx}
                                                    file={{ name: fileName, url: file.fileUrl }}
                                                    icon={icon}
                                                    label={label}
                                                    showRemove={false}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                                <div className="">
                                    {(msg.text && String(msg.text).trim() !== "") && (
                                        <div
                                            className={`px-4 py-3 ${isUser
                                                ? "bg-main text-white rounded-br-md rounded-[16px_16px_0px_16px] w-fit ml-auto"
                                                : "bg-screen-page text-gray-900 rounded-[16px_16px_16px_0px] w-fit"
                                                }`}
                                        >
                                            {!isUser && msg.botName && (
                                                <div className="text-xs font-semibold text-blue-700 mb-1">{msg.botName}</div>
                                            )}
                                            <div className="prose prose-sm max-w-none whitespace-pre-line break-words text-[15px]">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {typeof msg.text === "string"
                                                        ? msg.text
                                                        : msg.text
                                                            ? JSON.stringify(msg.text)
                                                            : ""}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
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