import React, { useState, useRef, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import PendingFileItem from "@/components/common/PendingFileItem";
import { getFileIconAndLabel } from "@/utils/fileTypeUtils";
import BotIcon from "@/icons/logo/AI.svg?react";
import AvatarPreviewModal from "@/components/common/AvatarPreviewModal";
import ChatMessageActions from "./ChatMessageActions";
import { ChatMessage } from "@/types/social-chat";
import ReplyBubble from "./ReplyBubble";
import { MessageBubble } from "./MessageBubble";
import PhotoAlbum from "react-photo-album";
import "react-photo-album/rows.css";
import { Capacitor } from '@capacitor/core';

interface ChatMessageItemProps {
    msg: any;
    isUser: boolean;
    isError?: boolean;
    isSend?: boolean;
    onEditMessage?: (messageCode: string | number, messageText: string) => void;
    onRevokeMessage?: (messageCode: string | number) => void;
    onReplyMessage?: (message: ChatMessage) => void;
    isEdited: boolean;
    isRevoked: boolean;
    isReply: boolean;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
    msg,
    isUser,
    isError,
    isSend,
    onEditMessage,
    onRevokeMessage,
    onReplyMessage,
    isEdited,
    isRevoked,
    isReply
}) => {
    const isNative = Capacitor.isNativePlatform();

    const hasText = typeof msg.messageText === "string" && msg.messageText.trim() !== "";
    const showText = hasText || msg.isRevoked === 1;

    const [previewImg, setPreviewImg] = useState<string | null>(null);
    const [showActions, setShowActions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(msg.messageText || "");
    const [showActionsMobile, setShowActionsMobile] = useState(false);


    const longPressTimer = useRef<any>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const actionContainerRef = useRef<HTMLDivElement>(null);

    const controls = useAnimation();
    const imageFiles = msg.chatAttachments.filter((file: any) =>
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file.fileName || "")
    );


    const photoAlbumPhotos = imageFiles.map((file: any) => ({
        src: file.fileUrl,
        width: 800,
        height: 600,

    }));


    const nonImageFiles = msg.chatAttachments.filter((file: any) =>
        !/\.(jpg|jpeg|png|gif|webp)$/i.test(file.fileName || "")
    );
    const handleStartEdit = () => {
        setIsEditing(true);
        setEditText(msg.messageText || "");
        setShowActions(false);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditText(msg.messageText || "");
    };

    const handleSaveEdit = () => {
        if (editText.trim() !== "" && editText !== msg.messageText) {
            onEditMessage?.(msg.code, editText.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };

    const handleStartRevoke = () => {
        if (onRevokeMessage) {
            onRevokeMessage(msg.code || msg.id);
        }
    };

    const handleStartReply = () => {
        if (onReplyMessage && !msg.isRevoked) {
            onReplyMessage(msg);
        }
    };
    const handleLongPressStart = (e: React.TouchEvent) => {
        // Ngăn event bubbling
        e.stopPropagation();

        const touch = e.changedTouches[0];
        const startX = touch.clientX;
        const startY = touch.clientY;

        longPressTimer.current = setTimeout(() => {
            setShowActionsMobile(true);
        }, 500);

        const handleMove = (moveEvent: TouchEvent) => {
            const moveTouch = moveEvent.changedTouches[0];
            const deltaX = Math.abs(moveTouch.clientX - startX);
            const deltaY = Math.abs(moveTouch.clientY - startY);

            if (deltaX > 15 || deltaY > 15) {
                if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                }
                document.removeEventListener('touchmove', handleMove);
                document.removeEventListener('touchend', handleEnd);
            }
        };

        const handleEnd = () => {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleEnd);
        };

        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);
    };

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [isEditing]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [editText]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (
                actionContainerRef.current &&
                !actionContainerRef.current.contains(event.target as Node)
            ) {
                setShowActionsMobile(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, []);

    return (
        <>

            {isEditing ? (
                <div className={`relative ${isUser ? "ml-auto" : ""} max-w-[calc(100vw-80px)]`}>
                    <div className="bg-white border-2 border-blue-500 rounded-lg p-2 shadow-lg">
                        <textarea
                            ref={textareaRef}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full resize-none border-none outline-none text-[15px] min-h-[60px]"
                            placeholder="Nhập tin nhắn..."
                            style={{ maxWidth: "350px" }}
                        />
                        <div className="flex justify-end gap-2 mt-2 pt-2 border-t">
                            <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={editText.trim() === "" || editText === msg.messageText}
                                className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-center">
                        Enter để lưu • Esc để hủy
                    </div>
                </div>
            ) : (
                <motion.div
                    key={typeof msg.id === "string" || typeof msg.id === "number" ? msg.id : String(msg.createdAt)}
                    className={`flex w-full mb-4 ${isUser ? "justify-end" : "justify-start"}`}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                    <motion.div
                        className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""} items-start w-full`}
                        drag="x"
                        dragDirectionLock
                        dragConstraints={isUser ? { left: -100, right: 0 } : { left: 0, right: 100 }}
                        dragElastic={0.2}
                        style={{
                            touchAction: isNative ? 'pan-y' : 'auto' // ← Platform specific
                        }}
                        onDrag={(e, info) => {
                            if (longPressTimer.current) {
                                clearTimeout(longPressTimer.current);
                                longPressTimer.current = null;
                            }
                            if (!isRevoked) {
                                if (isUser && info.offset.x > 0) {
                                    controls.start({ x: 0 });
                                }
                                if (!isUser && info.offset.x < 0) {
                                    controls.start({ x: 0 });
                                }
                            }
                        }}
                        onDragEnd={(e, info) => {
                            const offset = info.offset.x;
                            const threshold = 80;
                            const shouldTrigger =
                                (!isUser && offset > threshold) || (isUser && offset < -threshold);
                            if (shouldTrigger) {
                                handleStartReply();
                            }
                            controls.start({ x: 0 });
                        }}
                        animate={controls}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {!isUser && (
                            <div>
                                <BotIcon className="min-w-[30px] aspect-square object-contain" />
                            </div>
                        )}
                        <div
                            className="flex-1 flex flex-col items-start gap-1 relative group"
                            onTouchStart={isNative ? handleLongPressStart : undefined}
                            style={{
                                touchAction: isNative ? 'manipulation' : 'auto',
                                userSelect: 'none'
                            }}
                        >
                            {Array.isArray(msg.chatAttachments) && msg.chatAttachments.length > 0 && (
                                <div className={`flex  ${isUser ? "ml-auto" : "mr-auto"}`}
                                >
                                    <div className="mb-2 space-y-2 relative ">
                                        {photoAlbumPhotos.length > 0 && (
                                            <div className="w-[250px]">
                                                <PhotoAlbum
                                                    layout="masonry"
                                                    photos={photoAlbumPhotos}
                                                    spacing={8}
                                                    onClick={({ photo }) => setPreviewImg(photo.src)}
                                                />
                                            </div>
                                        )}
                                        {nonImageFiles.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {nonImageFiles.map((file: any, idx: number) => {
                                                    const fileName = file.fileName || "";
                                                    const { icon, label } = getFileIconAndLabel(fileName);
                                                    return (
                                                        <PendingFileItem
                                                            key={idx}
                                                            file={{ name: fileName, url: file.fileUrl }}
                                                            icon={icon}
                                                            label={label}
                                                            showRemove={false}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {!isRevoked && (
                                            <div ref={actionContainerRef}
                                                className={`absolute top-1/2 -translate-y-1/2 ${isUser ? "-left-16" : "-right-12"} ${showActionsMobile ? "flex" : "hidden group-hover:flex"} gap-2 p-1`}>
                                                {isUser && (<>
                                                    <button onClick={handleStartRevoke}>🗑️</button>
                                                </>)}
                                                <button onClick={handleStartReply}>↩️</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {showText && (
                                <>
                                    {msg.replyToMessage && (
                                        <ReplyBubble msg={msg.replyToMessage} isUser={isUser} />
                                    )}
                                    
                                    {/* Wrap MessageBubble với drag container */}
                                    <motion.div
                                        style={{
                                            touchAction: 'pan-y',
                                            userSelect: 'none'
                                        }}
                                        className={` ${isUser ? "ml-auto" : "mr-auto"}`}
                                    >
                                        <MessageBubble
                                            msg={msg}
                                            isUser={isUser}
                                            isError={isError}
                                            isSend={isSend}
                                            isEdited={isEdited}
                                            isRevoked={isRevoked}
                                            onEdit={handleStartEdit}
                                            onRevoke={handleStartRevoke}
                                            onReply={handleStartReply}
                                            actionContainerRef={actionContainerRef}
                                            showActionsMobile={showActionsMobile}
                                        />
                                    </motion.div>
                                </>
                            )}

                        </div>

                    </motion.div>
                </motion.div>
            )}

            <AvatarPreviewModal
                open={!!previewImg}
                src={previewImg || ""}
                alt="Preview"
                onClose={() => setPreviewImg(null)}
            />

            {!msg.isRevoked && showActions && (
                <ChatMessageActions
                    onEdit={handleStartEdit}
                    onRevoke={handleStartRevoke}
                    onReply={handleStartReply}
                    onCopy={() => {/* copy logic */ }}
                />
            )}
        </>
    );
};

export default ChatMessageItem;
