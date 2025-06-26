import React, { useRef, useEffect, useState } from "react";
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
import { ChatMessageList } from "./components/ChatMessageList";
import ChatInputBar from "./components/ChatInputBar";
import PendingFiles from "./components/PendingFiles";
import PendingImages from "./components/PendingImages";
import { useUpload } from "@/hooks/common/useUpload";
import { useChatStore } from "@/store/zustand/chat-store";
import { quickActions } from "./data";
dayjs.extend(utc);

const Chat: React.FC = () => {
    // ===== Params, Router =====
    const { type, sessionId } = useParams<{ sessionId?: string; type?: string }>();
    const history = useHistory();
    // ===== State =====

    const [hasFirstSignalRMessage, setHasFirstSignalRMessage] = useState(false);

    // ===== Refs =====
    const messageRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const prevSessionIdRef = useRef<string | undefined>(sessionId);
    // ===== Device Info =====
    const deviceInfo: { deviceId: string | null } = useDeviceInfo();

    // ===== Stores =====
    const {
        pendingImages,
        pendingFiles,
        addPendingImages,
        addPendingFiles,
        removePendingImage,
        removePendingFile,
        clearAll,
    } = useImageStore();

    const isSending = useChatStore((s) => s.isSending);
    const pendingMessages = useChatStore((s) => s.pendingMessages);
    const setPendingMessages = useChatStore((s) => s.setPendingMessages);
    const clearPendingMessages = useChatStore((s) => s.clearPendingMessages);
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
    const { messages: signalRMessages, setMessages: setSignalRMessages } = useSignalRChat(
        deviceInfo?.deviceId ?? ""
    );

    // ===== Other Hooks =====
    const { keyboardHeight, keyboardResizeScreen } = useKeyboardResize();
    const { showScrollButton, handleScroll } = useScrollButton(messagesContainerRef);
    useAutoResizeTextarea(messageRef, messageValue);
    const uploadImageMutation = useUpload();

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
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
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
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [signalRMessages]);


    useEffect(() => {
        if (prevSessionIdRef.current !== sessionId) {
            clearPendingMessages()
            setSignalRMessages([]);
            clearAll();
            setHasFirstSignalRMessage(false);
        }
        prevSessionIdRef.current = sessionId;
        return () => {
            useChatStore.getState().setIsSending(false);
        };
    }, [sessionId]);
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
        setHasFirstSignalRMessage
    });

    // ===== Message Mapping (Render Helper) =====
    const mapSignalRMessage = (msg: any) => ({
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
    });

    const mapPendingMessage = (msg: any) => ({
        ...msg,
        isRight: true,
    });

    const allMessages = [
        ...messages,
        ...signalRMessages.map(mapSignalRMessage),
        ...pendingMessages.map(mapPendingMessage),
    ].sort((a, b) => a.timeStamp - b.timeStamp);

    return (
        <div
            className="flex flex-col"
            style={{
                paddingRight: 0,
                paddingLeft: 0,
                paddingBottom: !isWelcome ? (keyboardHeight > 0 ? (keyboardResizeScreen ? 76 : keyboardHeight) : 76) : 0,
                height: "100dvh",
                paddingTop: "var(--safe-area-inset-top)",
            }}
        >

            <div className="flex items-center justify-between px-6 py-4 ">
                <button onClick={() => openSidebarWithAuthCheck()} >
                    <img src="logo/nav_bar_home_history.svg" />
                </button>
                {(!isWelcome) && (
                    <>
                        <span className="font-semibold text-main uppercase tracking-wide">
                            {title}
                        </span>
                        <button onClick={() => history.push("/home")}>
                            <img src="/logo/chat/x.svg" alt={t("close")} />
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
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="flex items-center gap-2 mb-4 ">
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-100">
                                <img src="/logo/AI.svg" alt="bot" className="" />
                            </span>
                            <span className="text-[22px] font-bold text-main">{t("How can I help you?")}</span>
                        </div>
                        <div className="w-full  mx-auto bg-white rounded-2xl shadow-[0px_-3px_10px_0px_#00000033] px-6 py-4 flex flex-col gap-2">
                            <div className="flex  gap-2 flex-wrap">
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
                            <textarea
                                placeholder={t("Enter your message...")}
                                ref={messageRef}
                                value={messageValue}
                                onChange={(e) => setMessageValue(e.target.value)}
                                className="flex-1 focus:outline-none resize-none"
                                rows={1}
                            />
                            <div className="flex justify-between items-center">
                                <div className="flex gap-6">
                                    <button onClick={() => history.push("/take-photo")}>
                                        <img src="/logo/chat/cam.svg" alt={t("camera")} />
                                    </button>
                                    <label>
                                        <img src="logo/chat/image.svg" alt={t("image")} />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                    <label>
                                        <img src="logo/chat/file.svg" alt={t("file")} />
                                        <input
                                            type="file"
                                            multiple
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => handleSendMessage(e, true)}
                                    disabled={isSending || (!messageValue.trim() && pendingImages.length === 0 && pendingFiles.length === 0)}
                                >
                                    <img src="logo/chat/send.svg" alt={t("send")} />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full mt-8">
                            {quickActions.map((item) => (
                                <button
                                    key={item.to}
                                    className="flex items-center gap-4 p-4 rounded-3xl w-full  bg-white shadow-[0px_2px_2px_2px_#0000001A] transition hover:shadow-md"
                                    onClick={() => history.push(item.to)}
                                >
                                    <span className={`inline-flex items-center justify-center rounded-full `}>
                                        <img src={item.icon} alt={item.alt} className="w-8 aspect-square " />
                                    </span>
                                    <span className="font-semibold text-main text-left leading-none break-words line-clamp-2">
                                        {item.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <ChatMessageList
                        allMessages={allMessages}
                        pendingMessages={pendingMessages}
                        topicType={topicType}
                        title={title}
                        loading={isSending}
                    />
                )}
                <div ref={messagesEndRef} />
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
                        onTakePhoto={() => history.push("/take-photo")}
                        isSpending={isSending}
                    />
                </div>
            )}
        </div>
    );
};

export default Chat;

