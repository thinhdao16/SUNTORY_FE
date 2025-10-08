/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { motion } from "framer-motion";
import PendingFileItem from "@/components/common/PendingFileItem";
import { getFileIconAndLabel } from "@/utils/fileTypeUtils";
import { handleCopyToClipboard } from "@/components/common/HandleCoppy";
import BotIcon from "@/icons/logo/AI.svg?react";
import CopyIcon from "@/icons/logo/chat/coppy.svg?react";
import AvatarPreviewModal from "@/components/common/AvatarPreviewModal";
import "../ChatStream.module.css"
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import { MessageState } from "@/types/chat-message";
import RetryIcon from "@/icons/logo/chat/retry.svg?react";
import removeMarkdown from "remove-markdown";
const ChatStreamMessageItem: React.FC<{
    msg: any;
    isUser: boolean;
    isError?: boolean;
    isSend?: boolean;
    isSpending?: boolean;
    loading?: boolean;
    hideAvatar?: boolean;
    onRetryMessage?: (msgId: string) => void;
}> = ({ msg, isUser, isError, isSend, onRetryMessage, isSpending, loading, hideAvatar }) => {
    const [showCopy, setShowCopy] = useState(false);
    const [previewImg, setPreviewImg] = useState<string | null>(null);
    const handleBubbleClick = () => {
        if (isUser) setShowCopy(true);

    };
    const isPendingThis =
        msg.text === MessageState.PENDING ||
        msg.messageState === MessageState.PENDING ||
        msg.messageState === "SENDING" ||
        msg.text === 'PENDING_MESSAGE';
    const canShowCopy = !isPendingThis;
    return (
        <>
            {/* <motion.div
                key={typeof msg.id === "string" || typeof msg.id === "number" ? msg.id : String(msg.createdAt)}
                className={`flex w-full mb-4 ${isUser ? "justify-end" : "justify-start"}`}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
            > */}
            <motion.div
                key={msg.id ?? msg.createdAt}
                initial={!msg.isStreaming ? { opacity: 0, y: 40 } : false}
                animate={!msg.isStreaming ? { opacity: 1, y: 0 } : false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`flex w-full mb-4 ${isUser ? "justify-end" : "justify-start"}`}
            >
                <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""} items-start w-full`}>
                    {!isUser && !hideAvatar && (
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
                                            <div key={fileIdx} className="relative group">
                                                <a
                                                    rel="noopener noreferrer"
                                                    tabIndex={-1}
                                                    onClick={e => {
                                                        e.preventDefault();
                                                        setPreviewImg(file.fileUrl);
                                                    }}
                                                >
                                                    <img
                                                        src={file.fileUrl}
                                                        alt={fileName}
                                                        className="w-[200px] aspect-square object-cover rounded-xl cursor-pointer"
                                                    // onError={(e) => handleImageError(e, "/public/temp_logo.png")}
                                                    />
                                                </a>
                                                {/* <button
                                                    className="absolute top-2 right-2 p-1 rounded bg-white/80 hover:bg-gray-100 transition opacity-0 group-hover:opacity-100"
                                                    type="button"
                                                    onClick={() => handleCopyToClipboard(file.fileUrl)}
                                                    title="Copy image link"
                                                >
                                                    <CopyIcon className="w-5 h-5" />
                                                </button> */}
                                            </div>
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
                        {(!isUser && msg.text === MessageState.FAILED) ? (
                            <div
                                className="relative bg-red-50 text-red-700 border border-red-400 rounded-[16px_16px_16px_16px] group"
                                style={{ maxWidth: "calc(100vw - 80px)" }}
                                tabIndex={0}
                            >
                                <div className="overflow-x-auto w-full px-4 py-3 min-w-[60px] xl:max-w-[350px] flex justify-between">
                                    <div className="prose prose-sm whitespace-break-spaces break-words text-[15px] font-semibold">
                                        Tin nhắn thất bại, vui lòng thử lại.
                                    </div>
                                    <RetryIcon
                                        className="cursor-pointer hover:scale-110 transition-transform"

                                        onClick={async () => {
                                            if (!loading || !isSpending) {
                                                try {
                                                    await onRetryMessage?.(msg.replyToMessageId);
                                                } catch (error) {
                                                    console.error('Retry failed:', error);
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            msg.text !== MessageState.PENDING && (msg.text && String(msg.text).trim() !== "") && (
                                <div
                                    className={`relative group ${isError && !isSend
                                        ? "bg-red-50 text-red-700 border border-red-400 rounded-[16px_16px_16px_16px]"
                                        : isUser
                                            ? "bg-main text-white rounded-br-md rounded-[16px_16px_0px_16px] ml-auto"
                                            : "bg-screen-page text-gray-900 rounded-[0px_16px_16px_16px]"
                                        }`}
                                    style={{ maxWidth: "calc(100vw - 80px)" }}
                                    tabIndex={0}
                                    onClick={handleBubbleClick}
                                    onTouchStart={handleBubbleClick}
                                >
                                    <div className="overflow-x-auto w-full px-4 py-3 min-w-[60px] xl:max-w-[350px]">
                                        <div className="">
                                            <MarkdownRenderer text={msg.text} />
                                        </div>
                                    </div>
                                </div>
                            )
                        )}

                        {isUser || msg.text === MessageState.FAILED || msg.text === MessageState.PENDING ? (
                            <>
                                {canShowCopy && (
                                    <div className="flex justify-end mt-1">
                                        <button
                                            className="bottom-2 right-2 p-1 rounded hover:bg-gray-100 transition opacity-100"
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopyToClipboard(
                                                    typeof msg.text === "string"
                                                        ? removeMarkdown(msg.text)
                                                        : msg.text
                                                            ? removeMarkdown(JSON.stringify(msg.text))
                                                            : ""
                                                );
                                            }}
                                            title="Copy"
                                        >
                                            <CopyIcon />
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {canShowCopy && (
                                    <div className="flex justify-end mt-1">
                                        <button
                                            className="bottom-2 right-2 p-1 rounded hover:bg-gray-100 transition opacity-100"
                                            type="button"
                                            onClick={() => handleCopyToClipboard(
                                                typeof msg.text === "string"
                                                    ? removeMarkdown(msg.text)
                                                    : msg.text
                                                        ? removeMarkdown(JSON.stringify(msg.text))
                                                        : ""
                                            )}
                                            title="Copy"
                                        >
                                            <CopyIcon />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
            <AvatarPreviewModal
                open={!!previewImg}
                src={previewImg || ""}
                alt="Preview"
                onClose={() => setPreviewImg(null)}
            />
        </>
    )
}

export default ChatStreamMessageItem;