import React, { useRef, useEffect, useState, useMemo } from "react";
import { useHistory, useParams } from "react-router-dom";
import "./Chat.module.css";
import { IoArrowDown } from "react-icons/io5";
import { useChatMessages } from "./hooks/useChatMessages";
import { useKeyboardResize } from "./hooks/useKeyboardResize";
import { useScrollButton } from "./hooks/useScrollButton";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";
import { useImageStore } from "@/store/zustand/image-store";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useSignalRChat } from "@/hooks/useSignalRChat";
import { TopicType, TopicTypeLabel } from "@/constants/topicType";
import { openSidebarWithAuthCheck } from "@/store/zustand/ui-store";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { generatePreciseTimestampFromDate } from "@/utils/time-stamp";
import { useChatHandlers } from "./hooks/useChatHandlers";
import ChatInputBar from "./components/ChatInputBar";
import PendingFiles from "./components/PendingFiles";
import PendingImages from "./components/PendingImages";
import { useUpload } from "@/hooks/common/useUpload";
import { useChatStore } from "@/store/zustand/chat-store";
import { useSignalRChatStore } from "@/store/zustand/signalr-chat-store";
import { ChatMessageList } from "./components/ChatMessageList";
import ChatWelcomePanel from "./components/ChatWelcomePanel";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import NavBarHomeHistoryIcon from "@/icons/logo/nav_bar_home_history.svg?react";
import CloseIcon from "@/icons/logo/chat/x.svg?react";
dayjs.extend(utc);

const Chat: React.FC = () => {
    // ===== Params, Router =====
    const { type, sessionId } = useParams<{ sessionId?: string; type?: string }>();
    const history = useHistory();
    // ===== State =====

    const [hasFirstSignalRMessage, setHasFirstSignalRMessage] = useState(false);

    // ===== Refs =====
    const messageRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const prevSessionIdRef = useRef<string | undefined>(sessionId);
    const prevTypeRef = useRef<string | undefined>(type);

    // ===== Device Info =====
    const deviceInfo: { deviceId: string | null, language: string | null } = useDeviceInfo();

    // ===== Stores =====
    const {
        pendingImages,
        pendingFiles,
        addPendingImages,
        addPendingFiles,
        removePendingImage,
        removePendingFile,
        clearAll,
        removePendingImageByUrl
    } = useImageStore();

    const isSending = useChatStore((s) => s.isSending);
    const pendingMessages = useChatStore((s) => s.pendingMessages);
    const setPendingMessages = useChatStore((s) => s.setPendingMessages);
    const clearPendingMessages = useChatStore((s) => s.clearPendingMessages);
    const stopMessages = useChatStore((s) => s.stopMessages);
    const setStopMessages = useChatStore((s) => s.setStopMessages);
    // ===== Chat & Message Hooks =====
    const {
        messages,
        isLoading,
        sendMessage,
        scrollToBottom,
        messageValue,
        setMessageValue,
    } = useChatMessages(messageRef, messagesEndRef, messagesContainerRef, sessionId, hasFirstSignalRMessage);

    // ===== SignalR =====


    const allSignalRMessages = useSignalRChatStore((s: any) => s.messages);

    const signalRMessages = useMemo(
        () =>
            allSignalRMessages.filter(
                (msg: any) => msg.chatInfo?.code === sessionId || msg.code === sessionId
            ),
        [allSignalRMessages, sessionId]
    );
    const setSignalRMessages = useSignalRChatStore((s) => s.setMessages);
    // ===== Other Hooks =====
    const { keyboardHeight, keyboardResizeScreen } = useKeyboardResize();
    const { showScrollButton, handleScroll } = useScrollButton(messagesContainerRef);
    useAutoResizeTextarea(messageRef, messageValue);
    useSignalRChat(deviceInfo.deviceId || "");

    const uploadImageMutation = useUpload();
    const scrollToBottomMess = useScrollToBottom(messagesEndRef);
    // ===== Derived State =====
    const topicTypeNum = type ? Number(type) : undefined;
    const isValidTopicType = topicTypeNum !== undefined && Object.values(TopicType).includes(topicTypeNum as TopicType);
    const topicType: TopicType | undefined = isValidTopicType ? (topicTypeNum as TopicType) : undefined;
    const title = isValidTopicType && topicType !== undefined ? TopicTypeLabel[topicType] : undefined;

    const isWelcome =
        topicType === TopicType.Chat &&
        !sessionId && pendingMessages.length === 0;
    // ===== Effects =====
    useEffect(() => {
        if (sessionId && !isLoading) {
            clearPendingMessages()
        }
    }, [isLoading]);

    useEffect(() => {
        if (!isValidTopicType) {
            history.push("/home");
        }
        if (messagesEndRef.current) {
            scrollToBottomMess()
        }
    }, [isValidTopicType, history, messages]);

    useEffect(() => {
        setPendingMessages((prev) =>
            prev.filter(
                (pending) =>
                    !messages.some(
                        (msg) =>
                            msg.text?.trim() === pending.text?.trim() &&
                            Math.abs(dayjs(msg.createdAt).valueOf() - dayjs(pending.createdAt).valueOf()) < 5000
                    )
            )
        );
    }, [messages]);

    useEffect(() => {
        if (messagesEndRef.current) {
            scrollToBottomMess()
        }
    }, [signalRMessages, type]);

    useEffect(() => {
        if (
            prevSessionIdRef.current !== sessionId &&
            prevSessionIdRef.current &&
            sessionId &&
            prevSessionIdRef.current.split("/")[0] !== sessionId.split("/")[0]
        ) {
            setHasFirstSignalRMessage(false);
            setSignalRMessages?.([]);
            clearPendingMessages();
        }
        prevSessionIdRef.current = sessionId;
        prevTypeRef.current = type;
        return () => {
            useChatStore.getState().setIsSending(false);
        };
    }, [sessionId, type]);
    // ===== Handlers =====
    const {
        handleImageChange,
        handleFileChange,
        handleSendMessage,
    } = useChatHandlers({
        addPendingImages,
        addPendingFiles,
        setPendingMessages,
        setSignalRMessages,
        clearAll,
        history,
        sessionId,
        topicType: topicType !== undefined ? String(topicType) : "",
        pendingImages,
        pendingFiles,
        messageValue,
        setMessageValue,
        removePendingImage,
        removePendingFile,
        signalRMessages,
        uploadImageMutation,
        messagesEndRef,
        setHasFirstSignalRMessage,
        deviceInfo,
        stopMessages,
        setStopMessages,
        removePendingImageByUrl
    });

    const mapSignalRMessage = (msg: any) => {
        const base = {
            id: msg.id?.toString(),
            text: msg.massageText,
            isRight: msg.senderType === 10,
            createdAt: msg.createDate,
            timeStamp: generatePreciseTimestampFromDate(msg.createDate),
            senderType: msg.senderType,
            messageType: msg.messageType,
            userName: msg.userName,
            botName: msg.botName,
            userAvatar: msg.userAvatar,
            botAvatarUrl: msg.botAvatarUrl,
            attachments: msg.chatAttachments,
            replyToMessageId: msg.replyToMessageId,
            status: msg.status,
            chatInfoId: msg.chatInfoId,
            chatCode: msg.code,
        };
        if (msg.userChatMessage) {
            const userMsg = {
                id: msg.userChatMessage.id?.toString(),
                text: msg.userChatMessage.massageText,
                isRight: true,
                createdAt: msg.userChatMessage.createDate,
                timeStamp: generatePreciseTimestampFromDate(msg.userChatMessage.createDate),
                senderType: 10,
                messageType: msg.userChatMessage.messageType,
                userName: msg.userChatMessage.userName,
                botName: null,
                userAvatar: msg.userChatMessage.userAvatar,
                botAvatarUrl: null,
                attachments: msg.userChatMessage.chatAttachments,
                replyToMessageId: msg.userChatMessage.replyToMessageId,
                status: msg.userChatMessage.status,
                chatInfoId: msg.userChatMessage.chatInfoId,
                chatCode: msg.userChatMessage.code,
            };

            const isDuplicate =
                pendingMessages.some(
                    (pending) =>
                        (pending.id && userMsg.id && pending.id === userMsg.id) ||
                        (pending.chatCode && userMsg.chatCode && pending.chatCode === userMsg.chatCode) ||
                        (pending.text && userMsg.text && pending.text.trim() === userMsg.text.trim()) ||
                        // Kiểm tra file/ảnh trong attachments của pendingMessages
                        (pending.attachments &&
                            pending.attachments.some(
                                (att: any) =>
                                    userMsg.attachments?.[0]?.fileUrl &&
                                    att.fileUrl === userMsg.attachments[0].fileUrl
                            ))
                ) ||
                pendingImages.some(
                    (imgUrl) =>
                        userMsg.attachments?.[0]?.fileUrl &&
                        imgUrl === userMsg.attachments[0].fileUrl
                ) ||
                pendingFiles.some(
                    (fileUrl) =>
                        userMsg.attachments?.[0]?.fileUrl &&
                        fileUrl === userMsg.attachments[0].fileUrl
                );
            return isDuplicate ? [base] : [userMsg, base];
        }
        return [base];
    };

    const mapPendingMessage = (msg: any) => ({
        ...msg,
        isRight: true,
    });
    const allSignalR = signalRMessages.flatMap(mapSignalRMessage);
    const allPending = pendingMessages.map(mapPendingMessage);
    const mergedMessages = [
        ...messages,
        ...allSignalR.filter(
            (msg: any) =>
                !messages.some(
                    (m) =>
                        (m.id && msg.id && m.id === msg.id) ||
                        (m.chatCode && msg.chatCode && m.chatCode === msg.chatCode)
                )
        ),
        ...allPending,
    ].sort((a, b) => a.timeStamp - b.timeStamp);

    return (
        <div
            className="flex flex-col bg-white"
            style={{
                paddingRight: 0,
                paddingLeft: 0,
                paddingBottom: !isWelcome ? (keyboardHeight > 0 ? (keyboardResizeScreen ? 76 : keyboardHeight) : 76) : 0,
                height: "100dvh",
                // paddingTop: "var(--safe-area-inset-top, 0px)",
            }}
        >

            <div className="flex items-center justify-between px-6 pb-4 pt-14 h-[49px]">
                <button onClick={() => openSidebarWithAuthCheck()} >
                    <NavBarHomeHistoryIcon />
                </button>
                {(!isWelcome) && (
                    <>
                        <span className="font-semibold text-main uppercase tracking-wide">
                            {t(title || "")}
                        </span>
                        <button onClick={() => history.push("/home")}>
                            <CloseIcon aria-label={t("close")} />
                        </button>
                    </>
                )}
            </div>
            <div
                className="flex-1 overflow-y-auto p-6"
                ref={messagesContainerRef}
                onScroll={handleScroll}
            >
                {isWelcome ? (
                    <ChatWelcomePanel
                        pendingImages={pendingImages}
                        pendingFiles={pendingFiles}
                        uploadImageMutation={uploadImageMutation}
                        removePendingImage={removePendingImage}
                        removePendingFile={removePendingFile}
                        messageValue={messageValue}
                        setMessageValue={setMessageValue}
                        isLoading={isLoading}
                        isSending={isSending}
                        handleImageChange={handleImageChange}
                        handleFileChange={handleFileChange}
                        handleSendMessage={handleSendMessage}
                        history={history}
                        messageRef={messageRef}
                        addPendingImages={addPendingImages}
                    />
                ) : (
                    <ChatMessageList
                        allMessages={mergedMessages}
                        pendingMessages={pendingMessages}
                        topicType={topicType}
                        title={title}
                        loading={isSending}
                    />
                )}
                <div ref={messagesEndRef} className="mt-4" />
            </div>
            {!isWelcome && (
                <div className={`bg-white pb-4 bottom-0 w-full shadow-[0px_-3px_10px_0px_#0000000D] ${keyboardResizeScreen ? "fixed" : "sticky"}`}>
                    {showScrollButton && (
                        <div className="absolute top-[-42px] left-1/2 transform -translate-x-1/2">
                            <button
                                className="p-2.5 rounded-full shadow bg-white"
                                onClick={scrollToBottom}
                            >
                                <IoArrowDown />
                            </button>
                        </div>
                    )}
                    <div className="flex px-6 pt-4 gap-2 flex-wrap">
                        <PendingImages
                            pendingImages={pendingImages}
                            imageLoading={uploadImageMutation.isLoading}
                            removePendingImage={removePendingImage}
                        />
                        <PendingFiles
                            pendingFiles={pendingFiles}
                            removePendingFile={removePendingFile}
                        />
                    </div>
                    <ChatInputBar
                        messageValue={messageValue}
                        setMessageValue={setMessageValue}
                        isLoading={isLoading}
                        messageRef={messageRef}
                        handleSendMessage={handleSendMessage}
                        handleImageChange={handleImageChange}
                        handleFileChange={handleFileChange}
                        onTakePhoto={() => history.push("/camera")}
                        isSpending={isSending}
                        uploadImageMutation={uploadImageMutation}
                        addPendingImages={addPendingImages}
                    />
                </div>
            )}
        </div>
    );
};

export default Chat;

