import React from "react";
import { motion } from "framer-motion";
import PendingFileItem from "@/components/common/PendingFileItem";
import { getFileIconAndLabel } from "@/utils/fileTypeUtils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { handleImageError } from "@/utils/image-utils";
import { handleCopyToClipboard } from "@/components/common/HandleCoppy";
import BotIcon from "@/icons/logo/AI.svg?react";
import CopyIcon from "@/icons/logo/chat/coppy.svg?react";
import "../Chat.module.css"

const ChatMessageItem: React.FC<{ msg: any; isUser: boolean; isError?: boolean; isSend?: boolean }> = ({ msg, isUser, isError, isSend }) => {
    return (
        <motion.div
            key={typeof msg.id === "string" || typeof msg.id === "number" ? msg.id : String(msg.createdAt)}
            className={`flex w-full mb-4 ${isUser ? "justify-end" : "justify-start"}`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
            <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""} items-start w-full`}>
                {!isUser && (
                    <div>
                        <BotIcon className="min-w-[30px] aspect-square object-contain" />
                    </div>
                )}
                <div className="flex-1 flex flex-col" >
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
                                                className="w-[200px] aspect-square object-cover rounded-xl"
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
                    {(msg.text && String(msg.text).trim() !== "") && (
                        <div
                            className={`relative  ${isError && !isSend
                                ? "bg-red-50 text-red-700 border border-red-400 rounded-[16px_16px_16px_16px]"
                                : isUser
                                    ? "bg-main text-white rounded-br-md rounded-[16px_16px_0px_16px] ml-auto"
                                    : "bg-screen-page text-gray-900 rounded-[0px_16px_16px_16px]"
                                }
                                `}
                            style={{ maxWidth: "calc(100vw - 80px)" }}
                        >
                            <div className="overflow-x-auto w-full px-4 py-3 min-w-[60px] xl:max-w-[350px] ">
                                <div className="prose prose-sm whitespace-pre-line break-words text-[15px] ">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            table: ({ node, ...props }) => (
                                                <div className="overflow-x-auto max-w-full my-2">
                                                    <table {...props} />
                                                </div>
                                            ),
                                        }}
                                    >
                                        {typeof msg.text === "string"
                                            ? msg.text
                                            : msg.text
                                                ? JSON.stringify(msg.text)
                                                : ""}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    )}

                    {!isUser && (
                        <div className=" flex justify-end mt-1">
                            <button
                                className=" bottom-2 right-2 p-1 rounded hover:bg-gray-100 transition"
                                type="button"
                                onClick={() => handleCopyToClipboard(
                                    typeof msg.text === "string"
                                        ? msg.text
                                        : msg.text
                                            ? JSON.stringify(msg.text)
                                            : ""
                                )}
                                title={t("Copy")}
                            >
                                <CopyIcon />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

export default ChatMessageItem;