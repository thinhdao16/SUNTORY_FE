import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import ImagesPreviewModal from "@/components/common/ImagesPreviewModal";
import ReplyBubble from "./ReplyBubble";
import { ImageGallery } from "./ImageGallery";
import { MessageEditor } from "./MessageEditor";
import { DraggableMessageContainer } from "./DraggableMessageContainer";
import { ChatMessage } from "@/types/social-chat";
import { Capacitor } from "@capacitor/core";
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg";
import { useSocialChatStore } from "@/store/zustand/social-chat-store";
import { useCreateTranslationChat } from "@/pages/Translate/hooks/useTranslationLanguages";
import { useParams } from "react-router";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { languageMap } from "@/constants/languageLocale";
import { useTranslation } from "react-i18next";
import { MdOutlineReply, MdModeEditOutline, MdTranslate, MdContentCopy } from "react-icons/md";
import { FaRegTrashAlt } from "react-icons/fa";
import { MessageBubble } from "./MessageBubble";
import MessageStatus from "./MessageStatus";

import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react";
import { useLongPressOpen } from "@/hooks/useLongPressOpen";
import "./ChatMessageItem.css";
import Portal from "@/components/common/Portal";
import ChatSystemMessage from "./ChatSystemMessage";
import { KEYCHATFORMATNOTI, SystemMessageType } from "@/constants/socialChat";

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
    isLastUserMessage?: boolean;
    isLastMessageInConversation?: boolean;
    isSendingMessage?: boolean;
    activeUserIds?: number[];
    isLatestFriendlyAccepted?: boolean;
    roomData?: any;
}

const REACTIONS = ["❤️", "🙂", "😮", "🤢", "😡", "😂"];
type OverlayKind = "message" | "images";

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
function useVirtualRef(rect: DOMRect | null) {
    return useMemo(
        () => ({
            getBoundingClientRect: () => rect ?? new DOMRect(),
            contextElement: null as unknown as Element | null,
        }),
        [rect]
    );
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
    isGroup,
    currentUserId,
    hasReachedLimit,
    isLastUserMessage,
    isLastMessageInConversation,
    isSendingMessage,
    activeUserIds,
    isLatestFriendlyAccepted = false,
    roomData
}) => {

    const isDesktop = () => window.innerWidth > 1024;

    const { roomId } = useParams<{ roomId?: string; type?: string }>();
    const { t, i18n } = useTranslation();
    const isNative = Capacitor.isNativePlatform();
    const { language: deviceLanguage } = useDeviceInfo();

    const hasText = typeof msg.messageText === "string" && msg.messageText.trim() !== "";
    const showText = hasText || msg.isRevoked === 1;

    const [isEditing, setIsEditing] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [previewList, setPreviewList] = useState<string[]>([]);
    const [previewIndex, setPreviewIndex] = useState(0);

    const [translatingMessages, setTranslatingMessages] = useState<Set<string>>(new Set());

    const [menuOpen, setMenuOpen] = useState(false);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

    const [overlayKind, setOverlayKind] = useState<OverlayKind>("message");

    const [menuH, setMenuH] = useState(0);
    const [menuW, setMenuW] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    const actionContainerRef = useRef<HTMLDivElement>(null);
    const { roomChatInfo, translateMessageByCode } = useSocialChatStore();
    const createTranslationMutation = useCreateTranslationChat();
    const { bind } = useLongPressOpen(320);

    const avatarUrl = useMemo(() => {
        const p = roomChatInfo?.participants?.find((u: any) => u.user?.id === msg.userId);
        return p?.user?.avatar || roomChatInfo?.avatarRoomChat || avatarFallback;
    }, [msg?.userId, roomChatInfo]);

    const replyTo = msg.replyToMessage;
    const repliedName = replyTo?.userName ?? "";
    const isSelfReply = !!replyTo && replyTo.userId === msg.userId;
    const isReplyingToMe = !!replyTo && currentUserId && replyTo.userId === currentUserId;

    const anchorId = useMemo(() => `__chat_anchor_${msg.code || msg.id}__`, [msg.code, msg.id]);

    const virtualRef = useVirtualRef(anchorRect);
    const { refs, floatingStyles, update } = useFloating({
        open: menuOpen,
        onOpenChange: setMenuOpen,
        placement: isUser ? "top-end" : "top-start",
        strategy: "fixed",
        middleware: [offset(12), flip(), shift({ padding: 12 })],
        whileElementsMounted: autoUpdate,
    });
    const layout = useMemo(() => {
        if (!anchorRect) return null;
        const vw = typeof window !== "undefined" ? window.innerWidth : 360;
        const vh = typeof window !== "undefined" ? window.innerHeight : 640;

        const estMenuH = menuH || 120;
        const minMargin = 10;
        const safeTop = 12, safeBottom = 12;
        const gap = 12, pillH = 36;
        const H = anchorRect.height;
        const W = anchorRect.width;
        const maxBubbleHRaw =
            vh
            - (estMenuH + gap + minMargin)
            - (pillH + gap + minMargin)
            - (safeTop + safeBottom);

        const maxBubbleH = Math.max(48, maxBubbleHRaw);
        const H_eff = Math.max(24, Math.min(anchorRect.height, maxBubbleH));
        const LB = Math.max(safeTop, minMargin + (menuH || 0) + gap);
        const UB = Math.min(
            vh - safeBottom - H_eff,
            vh - minMargin - pillH - gap - H_eff
        );
        let bubbleTop: number;
        let clipped = false;
        if (LB <= UB) {
            bubbleTop = clamp(anchorRect.top, LB, UB);
        } else {
            clipped = true;
            bubbleTop = clamp(LB, safeTop, vh - safeBottom - H_eff);
        }
        let menuTop = bubbleTop - (estMenuH + gap);
        if (menuTop < minMargin) menuTop = minMargin;
        const pillTop = bubbleTop + H_eff + gap;
        let pillBottom = vh - (pillTop + pillH);
        if (pillBottom < minMargin) pillBottom = minMargin;
        const rawLeft = isUser
            ? (anchorRect.left + anchorRect.width) - (menuW || 220)
            : anchorRect.left;
        const menuLeft = clamp(rawLeft, 8, Math.max(8, vw - 8 - (menuW || 220)));
        const centerX = clamp(anchorRect.left + anchorRect.width / 2, 10, vw - 10);
        return {
            bubbleTop,
            bubbleH: H_eff,
            maxBubbleH,
            clipped,
            pillBottom,
            centerX,
            menuTop,
            menuLeft,
        };
    }, [anchorRect, isUser, menuH, menuW, menuOpen]);

    const enterEdit = () => {
        setMenuOpen(false);
        setAnchorRect(null);
        setOverlayKind("message");
        requestAnimationFrame(() => setIsEditing(true));
    };

    const saveEdit = (text: string) => { onEditMessage?.(msg.code, text); setIsEditing(false); };
    const revoke = () => onRevokeMessage?.(msg.code || msg.id);
    const reply = () => { if (onReplyMessage && !msg.isRevoked) onReplyMessage(msg); };

    const handleImageClick = (i: number, list: string[]) => {
        setPreviewList(list);
        setPreviewIndex(i);
        setOpenModal(true);
    };

    const getTargetLanguageId = (): number => {
        const target = (i18n.language || deviceLanguage || "").toLowerCase();
        if (languageMap[target]) return languageMap[target];
        const base = target.split("-")[0];
        if (languageMap[base]) return languageMap[base];
        return 3;
    };

    const handleTranslateMessage = async (messageId: string, text: string) => {
        try {
            setTranslatingMessages(prev => new Set([...prev, messageId]));
            const toLanguageId = getTargetLanguageId();
            const payload = { toLanguageId, originalText: text.trim() };
            const result = await createTranslationMutation.mutateAsync(payload);
            if (roomId) {
                translateMessageByCode(roomId, msg.code, {
                    translatedText: result?.data?.translated_text || "",
                    isTranslating: false,
                });
            }
        } finally {
            setTranslatingMessages(prev => { const s = new Set(prev); s.delete(messageId); return s; });
        }
    };

    const copyText = async () => {
        try { if (msg?.messageText) await navigator.clipboard.writeText(msg.messageText); } catch { }
    };

    const reactQuick = (emoji: string) => {
        console.log("react", emoji, "on", msg.code);
        setMenuOpen(false);
    };

    const shouldShowAvatar = msg._shouldShowAvatar !== false;
    const showSenderName = !!msg._showSenderName && !!msg.userName;
    const trunc = (s: string, n = 20) => (s.length > n ? s.slice(0, n) + "…" : s);
    useEffect(() => {
        if (!layout) return;
        refs.setReference(virtualRef as any);
        requestAnimationFrame(() => update());
    }, [layout, refs, virtualRef, update]);
    useEffect(() => {
        refs.setReference(virtualRef as any);
    }, [virtualRef, refs]);


    useEffect(() => {
        if (!menuOpen) return;
        const id = requestAnimationFrame(() => {
            if (menuRef.current) {
                setMenuH(menuRef.current.offsetHeight || 120);
                setMenuW(menuRef.current.offsetWidth || 40);
            }
        });
        return () => cancelAnimationFrame(id);
    }, [anchorRect, isUser, menuH, menuW, menuOpen, bind]);

    useEffect(() => {
        if (!menuOpen) return;
        const recalc = () => {
            const el = document.getElementById(anchorId);
            if (el) {
                const r = el.getBoundingClientRect();
                setAnchorRect(r);
                update();
            }
        };
        window.addEventListener("resize", recalc);
        document.addEventListener("scroll", recalc, true);
        return () => {
            window.removeEventListener("resize", recalc);
            document.removeEventListener("scroll", recalc, true);
        };
    }, [menuOpen, anchorId, update]);

    const parseSystemEvent = (text: string) => {
        try {
            const obj = typeof text === "string" ? JSON.parse(text) : text;
            if (obj && obj.Event && obj.Key) return obj;
        } catch {
        }
        return null;
    };

    const eventData = parseSystemEvent(msg.messageText);

    if (eventData && eventData.Event && eventData.Key === KEYCHATFORMATNOTI) {
        const eventType = SystemMessageType[eventData.Event as keyof typeof SystemMessageType];
        const systemData = {
            actor: eventData.Actor,
            targetUsers: eventData.Users || [],
            target: eventData.Users?.length === 1 ? eventData.Users[0] : undefined,
            userIds: eventData.UserIds,
            key: eventData.Key,
        };

        return (
            <ChatSystemMessage
                type={eventType}
                data={systemData}
                roomData={roomData}
                isLatestFriendlyAccepted={isLatestFriendlyAccepted}
            />
        );
    }

    const Bubble = (
        <div
            id={anchorId}
            className={`${isUser ? "ml-auto" : "mr-auto"} longpress-safe touch-pan-y select-none`}
            {...bind((info) => {
                const bubble = document.getElementById(anchorId) ?? (info.target as HTMLElement);
                const r = bubble.getBoundingClientRect();
                setAnchorRect(r);
                setOverlayKind("message");
                setMenuOpen(true);
                requestAnimationFrame(() => update());
            })}
        >
            <MessageBubble
                msg={msg}
                isUser={isUser}
                isError={isError}
                isSend={isSend}
                isEdited={isEdited}
                isRevoked={isRevoked}
                onEdit={enterEdit}
                onRevoke={revoke}
                onReply={reply}
                actionContainerRef={actionContainerRef}
                showActionsMobile={false}
                hasReachedLimit={hasReachedLimit}
                isTranslating={translatingMessages.has(msg.code)}
                onTranslate={() => handleTranslateMessage(msg.code, msg.messageText)}
            />
        </div>
    );
    const parseSystemMessageType = (text: string) => {
        if (typeof text !== "string") return null;
        const match = text.match(/^([A-Z0-9_]+)-?/);
        if (!match) return null;
        return match[1];
    };
    const SYSTEM_MESSAGE_MAP: Record<string, string> = {
        NOTIFY_GROUP_CHAT_CREATED: t("Group created"),
        NOTIFY_GROUP_CHAT_KICKED: t("Member removed from group"),
        NOTIFY_GROUP_CHAT_ADD_MEMBER: t("Member added to group"),
        NOTIFY_GROUP_CHAT_USER_LEAVE_GROUP: t("Member left the group"),
        NOTIFY_GROUP_CHAT_ADMIN_RENAME_GROUP: t("Group renamed"),
        NOTIFY_GROUP_CHAT_ADMIN_CHANGE_AVATAR_GROUP: t("Group avatar changed"),
        NOTIFY_GROUP_CHAT_ADMIN_LEAVE_GROUP: t("Admin left the group"),
        NOTIFY_GROUP_CHAT_CHANGE_ADMIN: t("New admin appointed"),
        NOTIFY_FRIENDLY_ACCEPTED: t("New friendship"),
    };

    const systemTypeKey = parseSystemMessageType(msg.messageText);
    const isSystemTextMessage = !!systemTypeKey && SYSTEM_MESSAGE_MAP[systemTypeKey];

    if (isSystemTextMessage) {
        return (
            <div className="px-4 py-2 my-2 bg-gray-100 rounded-lg text-center text-sm text-gray-600">
                {SYSTEM_MESSAGE_MAP[systemTypeKey]}
            </div>
        );
    }

    return (
        <>
            {isEditing ? (
                <MessageEditor
                    initialText={msg.messageText || ""}
                    onSave={saveEdit}
                    onCancel={() => setIsEditing(false)}
                    isUser={isUser}
                />
            ) : (
                <DraggableMessageContainer
                    messageId={typeof msg.id === "string" || typeof msg.id === "number" ? msg.id : String(msg.createdAt)}
                    isUser={isUser}
                    isRevoked={isRevoked}
                    onReply={reply}
                    onLongPress={() => {
                        const el = document.getElementById(anchorId);
                        if (!el) return;
                        const r = el.getBoundingClientRect();
                        setAnchorRect(r);
                        setMenuOpen(true);
                        requestAnimationFrame(() => update());
                    }}
                    setShowActionsMobile={() => { }}
                    hasReachedLimit={hasReachedLimit}
                >
                    {!isUser && shouldShowAvatar && (
                        <div className="flex flex-col items-center mr-2">
                            <img
                                src={avatarUrl || avatarFallback}
                                alt={msg.userName || "Avatar"}
                                className="w-[30px] aspect-square object-cover rounded-[12px]"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = avatarFallback; }}
                            />
                        </div>
                    )}
                    {!isUser && !shouldShowAvatar && <div className="w-[30px] ml-2" />}
                    <div className={`flex-1 flex flex-col ${isUser ? "items-end" : "items-start"}  gap-1 relative group`}>
                        <div className={`flex w-full ${isUser ? "justify-end pr-4" : "justify-start pl-4"} gap-1`}>
                            {isEdited && !isRevoked && !isUser && <div className="text-xs text-main font-semibold">{t("Edited")}</div>}
                            {replyTo && (
                                <div className={`text-xs text-gray-500 mb-1 ${isUser ? "text-right" : "text-left"}`}>
                                    {isSelfReply
                                        ? (isUser ? t("reply.self") : t("reply.selfOther", { name: trunc(msg.userName) }))
                                        : (isUser
                                            ? t("reply.youToOther", { name: trunc(repliedName) })
                                            : (isReplyingToMe
                                                ? t("reply.otherToYou", { name: trunc(msg.userName) })
                                                : t("reply.otherToOther", { name1: trunc(msg.userName), name2: trunc(repliedName) })))}
                                </div>
                            )}
                            {isEdited && !isRevoked && isUser && <div className="text-xs text-main font-semibold">{t("Edited")}</div>}
                        </div>
                        {isGroup && showSenderName && (<div className="text-xs text-gray-500 ml-1 mb-0.5">{msg.userName}</div>)}
                        {msg.replyToMessage && (<ReplyBubble msg={msg.replyToMessage} isUser={isUser} isRevoked={msg.replyToMessage.isRevoked === 1} />)}
                        <div
                            className="longpress-safe"
                            {...bind((info) => {
                                const r = (document.getElementById(anchorId) ?? (info.target as HTMLElement)).getBoundingClientRect();
                                setAnchorRect(r);
                                setOverlayKind("images");
                                setMenuOpen(true);
                                requestAnimationFrame(() => update());
                            })}
                        >
                            <ImageGallery
                                chatAttachments={msg.chatAttachments || []}
                                isUser={isUser}
                                onImageClick={(i, list) => {
                                    if (!menuOpen) {
                                        handleImageClick(i, list);
                                    }
                                }}
                                isRevoked={msg.isRevoked === 1}
                                actionContainerRef={actionContainerRef}
                                onEdit={enterEdit}
                                onRevoke={revoke}
                                onReply={reply}
                                showActionsMobile={false}
                                hasReachedLimit={hasReachedLimit || false}
                            />
                        </div>

                        {showText && Bubble}
                        
                        {isUser && !isRevoked && (
                            <MessageStatus 
                                message={msg}
                                isGroup={isGroup || false}
                                currentUserId={typeof currentUserId === 'string' ? parseInt(currentUserId) : (currentUserId || null)}
                                isLastUserMessage={isLastUserMessage || false}
                                isLastMessageInConversation={isLastMessageInConversation || false}
                                isSendingMessage={isSendingMessage}
                                activeUserIds={activeUserIds}
                            />
                        )}
                    </div>
                </DraggableMessageContainer>
            )}

            {!isRevoked && menuOpen && anchorRect && layout && (
                <Portal>
                    <motion.div
                        className="fixed inset-0 z-[50] bg-black/10 backdrop-blur-sm pointer-events-auto"
                        onPointerDown={() => setMenuOpen(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    />
                    <motion.div className="fixed z-[58]"
                        style={{ top: layout.bubbleTop, left: anchorRect.left, width: anchorRect.width }}
                        initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1.02, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    >
                        <div
                            style={{
                                maxHeight: Math.max(48, layout.bubbleH),
                                overflowY: anchorRect.height > layout.bubbleH ? "auto" : "visible",
                                WebkitOverflowScrolling: "touch",
                            }}
                            className="pointer-events-auto"
                        >
                            {overlayKind === "message" ? (
                                <MessageBubble
                                    msg={msg}
                                    isUser={isUser}
                                    isEdited={isEdited}
                                    isRevoked={isRevoked}
                                    isError={isError}
                                    isSend={isSend}
                                    onEdit={undefined}
                                    onRevoke={undefined}
                                    onReply={undefined}
                                    actionContainerRef={undefined}
                                    showActionsMobile={false}
                                    hasReachedLimit={true}
                                />
                            ) : (
                                <ImageGallery
                                    chatAttachments={msg.chatAttachments || []}
                                    isUser={isUser}
                                    onImageClick={handleImageClick}
                                    isRevoked={msg.isRevoked === 1}
                                    actionContainerRef={actionContainerRef}
                                    onEdit={enterEdit}
                                    onRevoke={revoke}
                                    onReply={reply}
                                    showActionsMobile={false}
                                    hasReachedLimit={hasReachedLimit || false}
                                />
                            )}

                        </div>
                    </motion.div>
                    {/* <div
                        className="fixed z-[60] pointer-events-none"
                        style={{ bottom: layout.pillBottom, left: layout.menuLeft, }}
                    >
                        <div className="pointer-events-auto bg-white rounded-full border border-gray-200 shadow-[0_6px_20px_rgba(0,0,0,0.15)] px-4 py-2">
                            <div className="flex items-center gap-2">
                                {REACTIONS.map(e => <button key={e} className="text-xl leading-none active:scale-95" onClick={() => reactQuick(e)}>{e}</button>)}
                                <button aria-label="More" className=" w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-bold leading-none active:scale-95" onClick={() => setMenuOpen(false)}>+</button>
                            </div>
                        </div>
                    </div> */}
                    <div
                        className="fixed z-[60] pointer-events-none"
                        style={{ top: layout.menuTop, left: layout.menuLeft }}
                    >
                        <div
                            ref={menuRef}
                            className="pointer-events-auto bg-success-500 rounded-2xl shadow-xl overflow-hidden min-w-[220px] py-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {!isRevoked && (
                                <button className="px-3 py-2 hover:bg-gray-100 w-full flex items-center gap-2"
                                    onClick={() => { setMenuOpen(false); reply(); }}>
                                    <MdOutlineReply className="text-lg" /> {t("Reply")}
                                </button>
                            )}
                            {!isRevoked && isUser && hasText && (
                                <button className="px-3 py-2 hover:bg-gray-100 w-full flex items-center gap-2"
                                    onClick={() => { setMenuOpen(false); setIsEditing(true); }}>
                                    <MdModeEditOutline className="text-lg" /> {t("Edit")}
                                </button>
                            )}
                            {!isRevoked && hasText && (
                                <button className="px-3 py-2 hover:bg-gray-100 w-full flex items-center gap-2"
                                    onClick={() => { setMenuOpen(false); handleTranslateMessage(msg.code, msg.messageText); }}>
                                    <MdTranslate className="text-lg" /> {t("Translate")}
                                </button>
                            )}
                            {/* {hasText && (
                                <button className="px-3 py-2 hover:bg-gray-100 w-full flex items-center gap-2"
                                    onClick={() => { copyText(); setMenuOpen(false); }}>
                                    <MdContentCopy className="text-lg" /> {t("Copy")}
                                </button>
                            )} */}
                            <div className="h-px bg-gray-200 my-1" />
                            {isUser && (
                                <button className="px-3 py-2 text-red-600 hover:bg-red-50 w-full flex items-center gap-2"
                                    onClick={() => { setMenuOpen(false); revoke(); }}>
                                    <FaRegTrashAlt className="text-lg" /> {t("Delete")}
                                </button>
                            )}
                        </div>
                    </div>
                </Portal>
            )}

            <ImagesPreviewModal
                open={openModal}
                images={previewList}
                index={previewIndex}
                onClose={() => setOpenModal(false)}
            />
        </>
    );
};

export default ChatMessageItem;
