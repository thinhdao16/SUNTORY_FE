// src/pages/SocialChat/SocialChatThread/components/ChatMessageItem.tsx
import React, { useState, useRef, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import BotIcon from "@/icons/logo/AI.svg?react";
import ChatMessageActions from "./ChatMessageActions";
import { ChatMessage } from "@/types/social-chat";
import ReplyBubble from "./ReplyBubble";
import { MessageBubble } from "./MessageBubble";
import ImagesPreviewModal from "@/components/common/ImagesPreviewModal";
import { ImageGallery } from "./ImageGallery";
import { MessageEditor } from "./MessageEditor";
import { DraggableMessageContainer } from "./DraggableMessageContainer";
import { Capacitor } from "@capacitor/core";

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

    const [showActions, setShowActions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showActionsMobile, setShowActionsMobile] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [previewList, setPreviewList] = useState<string[]>([]);
    const [previewIndex, setPreviewIndex] = useState(0);

    const actionContainerRef = useRef<HTMLDivElement>(null);

    // Handlers
    const handleStartEdit = () => {
        setIsEditing(true);
        setShowActions(false);
    };

    const handleSaveEdit = (text: string) => {
        onEditMessage?.(msg.code, text);
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleStartRevoke = () => {
        onRevokeMessage?.(msg.code || msg.id);
    };

    const handleStartReply = () => {
        if (onReplyMessage && !msg.isRevoked) {
            onReplyMessage(msg);
        }
    };

    const handleLongPress = () => {
        setShowActionsMobile(true);
    };

    const handleImageClick = (index: number, images: string[]) => {
        setPreviewList(images);
        setPreviewIndex(index);
        setOpenModal(true);
    };

    // Click outside handler
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

    if (isEditing) {
        return (
            <MessageEditor
                initialText={msg.messageText || ""}
                onSave={handleSaveEdit}
                onCancel={handleCancelEdit}
                isUser={isUser}
            />
        );
    }
console.log(msg)
    return (
        <>
            <DraggableMessageContainer
                messageId={typeof msg.id === "string" || typeof msg.id === "number" ? msg.id : String(msg.createdAt)}
                isUser={isUser}
                isRevoked={isRevoked}
                onReply={handleStartReply}
                onLongPress={handleLongPress}
                setShowActionsMobile={setShowActionsMobile}
            >
                {!isUser && (
                    <div>
                        <BotIcon className="min-w-[30px] aspect-square object-contain" />
                    </div>
                )}
                <div
                    className="flex-1 flex flex-col items-start gap-1 relative group"
                // onTouchStart={isNative ? handleLongPressStart : undefined}
                // style={{
                //     touchAction: isNative ? 'manipulation' : 'auto',
                //     userSelect: 'none'
                // }}
                >
                    {msg.replyToMessage && (
                        <ReplyBubble msg={msg.replyToMessage} isUser={isUser} />
                    )}

                    <ImageGallery
                        chatAttachments={msg.chatAttachments || []}
                        isUser={isUser}
                        onImageClick={handleImageClick}
                        isRevoked={msg.isRevoked === 1}
                        actionContainerRef={actionContainerRef}
                        onEdit={handleStartEdit}
                        onRevoke={handleStartRevoke}
                        onReply={handleStartReply}
                        showActionsMobile={showActionsMobile}
                    />
                    {showText && (
                        <>
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
            </DraggableMessageContainer>

            <ImagesPreviewModal
                open={openModal}
                images={previewList}
                index={previewIndex}
                onClose={() => setOpenModal(false)}
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