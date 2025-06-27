import React from "react";
import { motion } from "framer-motion";
import PendingFileItem from "@/components/common/PendingFileItem";
import { getFileIconAndLabel } from "@/utils/fileTypeUtils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { handleImageError } from "@/utils/image-utils";
import { handleCopyToClipboard } from "@/components/common/HandleCoppy";

const ChatMessageItem: React.FC<{ msg: any; isUser: boolean }> = ({ msg, isUser }) => (
    <motion.div
        key={typeof msg.id === "string" || typeof msg.id === "number" ? msg.id : String(msg.createdAt)}
        className={`flex w-full mb-4 ${isUser ? "justify-end" : "justify-start"}`}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
        <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""} items-start w-fit`}>
            {!isUser && (
                <div>
                    <img src="/logo/AI.svg" alt="bot" className="min-w-[30px] aspect-square object-contain" />
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
                        className={`relative px-4 py-3 ${isUser
                            ? "bg-main text-white rounded-br-md rounded-[16px_16px_0px_16px] w-fit ml-auto"
                            : "bg-screen-page text-gray-900 rounded-[0px_16px_16px_16px] w-fit"
                            }`}
                    >
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
                            <img src="logo/chat/coppy.svg" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    </motion.div>
);

export default ChatMessageItem;