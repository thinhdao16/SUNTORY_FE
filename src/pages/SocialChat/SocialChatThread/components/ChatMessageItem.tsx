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
import avatarFallback from "@/icons/logo/social-chat/avt-rounded-full.svg";
import { useSocialChatStore } from "@/store/zustand/social-chat-store";

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
    isGroup?: boolean;
    currentUserId?: number | string | null;
    hasReachedLimit?: boolean;
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
    isReply,
    isGroup = false,
    currentUserId = null,
    hasReachedLimit = false,
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

    const { roomChatInfo } = useSocialChatStore();
    const avatarUrl = useMemo(() => {
        // if (msg?.userAvatar) return msg.userAvatar;

        const participant = roomChatInfo?.participants?.find(
            (p: any) => p.user?.id === msg.userId
        );

        return participant?.user?.avatar || roomChatInfo?.avatarRoomChat || avatarFallback;
    }, [msg?.userAvatar, msg?.userId, roomChatInfo]);

    const replyTo = msg.replyToMessage;
    const repliedName = replyTo?.userName ?? "";
    const isSelfReply = !!replyTo && replyTo.userId === msg.userId;
    const isReplyingToMe = !!replyTo && currentUserId && replyTo.userId === currentUserId;

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
    const shouldShowAvatar = msg._shouldShowAvatar !== false;
    const isFirstInSequence = msg._isFirstInSequence !== false;
    const showSenderName = !!msg._showSenderName && !!msg.userName;
    const truncateName = (name: string, maxLength = 20) =>
        name.length > maxLength ? name.slice(0, maxLength) + "…" : name;
    return (
        <>
            <DraggableMessageContainer
                messageId={typeof msg.id === "string" || typeof msg.id === "number" ? msg.id : String(msg.createdAt)}
                isUser={isUser}
                isRevoked={isRevoked}
                onReply={handleStartReply}
                onLongPress={handleLongPress}
                setShowActionsMobile={setShowActionsMobile}
                hasReachedLimit={hasReachedLimit}
            >
                {!isUser && shouldShowAvatar && (
                    <div className="flex flex-col items-center mr-2">
                        <img
                            src={avatarUrl || avatarFallback}
                            alt={msg.userName || "Avatar"}
                            className="w-[30px] aspect-square object-cover rounded-full"
                            onError={(e) => {
                                e.currentTarget.src = avatarFallback;
                            }}
                        />
                    </div>
                )}
                {!isUser && !shouldShowAvatar && <div className="w-[30px] ml-2" />}
                <div className="flex-1 flex flex-col items-start gap-1 relative group">
                    <div className={`flex w-full  ${isUser ? "justify-end pr-4" : "justify-start pl-4"} gap-1 `}>
                        {isEdited && !isRevoked && !isUser && (
                            <div className={` text-xs text-main font-semibold `}>
                                Edited
                            </div>
                        )}
                        {replyTo && (
                            <div
                                className={`text-xs text-gray-500 mb-1 ${isUser ? "text-right" : "text-left"}`}
                            >
                                {isSelfReply
                                    ? (isUser
                                        ? "You are replying to yourself"
                                        : `${truncateName(msg.userName)} is replying to themselves`)
                                    : (isUser
                                        ? `You are replying to ${truncateName(repliedName)}`
                                        : (isReplyingToMe
                                            ? `${truncateName(msg.userName)} is replying to you`
                                            : `${truncateName(msg.userName)} is replying to ${truncateName(repliedName)}`))}
                            </div>
                        )}
                        {isEdited && !isRevoked && isUser && (
                            <div className={` text-xs text-main font-semibold `}>
                                Edited
                            </div>
                        )}
                    </div>
                    {isGroup && showSenderName && (
                        <div className="text-xs text-gray-500 ml-1 mb-0.5">{msg.userName}</div>
                    )}
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
                        hasReachedLimit={hasReachedLimit}
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
                                    hasReachedLimit={hasReachedLimit}
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