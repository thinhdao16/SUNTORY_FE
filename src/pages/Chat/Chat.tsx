// ================== Imports ==================
import React, { useRef, useEffect, useState, useMemo } from "react";
import { useHistory, useParams } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { Capacitor } from "@capacitor/core";
import { useQueryClient } from "react-query";

import { TopicType, TopicTypeLabel } from "@/constants/topicType";
import { t } from "@/lib/globalT";

import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useChatMessages } from "./hooks/useChatMessages";
import { useKeyboardResize } from "./hooks/useKeyboardResize";
import { useScrollButton } from "./hooks/useScrollButton";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import { useUploadChatFile } from "@/hooks/common/useUploadChatFile";
import { useAppState } from "@/hooks/useAppState";
import useNetworkStatus from "@/hooks/useNetworkStatus";
import { useChatHandlers } from "./hooks/useChatHandlers";

import { useChatStore } from "@/store/zustand/chat-store";
import { useImageStore } from "@/store/zustand/image-store";
import { useUploadStore } from "@/store/zustand/upload-store";
import { useSignalRChatStore } from "@/store/zustand/signalr-chat-store";
import { useSignalRStream } from "@/hooks/useSignalRStream";
import { openSidebarWithAuthCheck } from "@/store/zustand/ui-store";

import ChatInputBar from "./components/ChatInputBar";
import PendingFiles from "./components/PendingFiles";
import PendingImages from "./components/PendingImages";
import { ChatMessageList } from "./components/ChatMessageList";
import ChatWelcomePanel from "./components/ChatWelcomePanel";
import NavBarHomeHistoryIcon from "@/icons/logo/nav_bar_home_history.svg?react";
import CloseIcon from "@/icons/logo/chat/x.svg?react";

import "./Chat.module.css";
import { IoArrowDown } from "react-icons/io5";
import { mergeMessages } from "@/utils/mapSignalRMessage";
import { useChatHistoryLastModule } from "./hooks/useChatHistorylastModule";
import { IonSpinner } from "@ionic/react";

dayjs.extend(utc);

const Chat: React.FC = () => {
    // ==== Router & Params ====
    const { type, sessionId } = useParams<{ sessionId?: string; type?: string }>();
    const history = useHistory();
    const queryClient = useQueryClient();

    // ==== Device & Platform ====
    const deviceInfo: { deviceId: string | null, language: string | null } = useDeviceInfo();
    const isNative = Capacitor.isNativePlatform();
    const isOnline = useNetworkStatus();
    const isDesktop = typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

    // ==== State ====
    const [pendingBarHeight, setPendingBarHeight] = useState(0);
    // Thêm state để debounce loading
    const [debouncedLoading, setDebouncedLoading] = useState(false);

    // ==== Refs ====
    const messageRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const prevSessionIdRef = useRef<string | undefined>(sessionId);
    const prevTypeRef = useRef<string | undefined>(type);
    const pendingBarRef = useRef<HTMLDivElement>(null);

    // ==== Stores ====
    const {
        pendingImages, pendingFiles,
        addPendingImages, addPendingFiles,
        removePendingImage, removePendingFile,
        clearAll, removePendingImageByUrl
    } = useImageStore();

    const isSending = useChatStore((s) => s.isSending);
    const pendingMessages = useChatStore((s) => s.pendingMessages);
    const setPendingMessages = useChatStore((s) => s.setPendingMessages);
    const clearPendingMessages = useChatStore((s) => s.clearPendingMessages);
    const stopMessages = useChatStore((s) => s.stopMessages);
    const setStopMessages = useChatStore((s) => s.setStopMessages);
    const imageLoading = useUploadStore.getState().imageLoading;
    const clearSession = useChatStore((s) => s.clearSession);
    const setHasFirstSignalRMessage = useSignalRChatStore((s) => s.setHasFirstSignalRMessage);
    const hasFirstSignalRMessage = useSignalRChatStore((s) => s.hasFirstSignalRMessage);
    const allSignalRMessages = useSignalRChatStore((s: any) => s.messages);
    const setSignalRMessages = useSignalRChatStore((s) => s.setMessages);

    // ==== Derived State ====
    const signalRMessages = useMemo(() =>
        allSignalRMessages.filter((msg: any) => msg.chatInfo?.code === sessionId || msg.code === sessionId),
        [allSignalRMessages, sessionId]
    );

    const topicTypeNum = type ? Number(type) : undefined;
    const isValidTopicType = topicTypeNum !== undefined && Object.values(TopicType).includes(topicTypeNum as TopicType);
    const topicType: TopicType | undefined = isValidTopicType ? (topicTypeNum as TopicType) : undefined;
    const title = isValidTopicType && topicType !== undefined ? TopicTypeLabel[topicType] : undefined;
    const isWelcome = topicType === TopicType.Chat && !sessionId && pendingMessages.length === 0;

    // ==== Hooks: Chat & Message ====
    const {
        messages, isLoading, sendMessage,
        scrollToBottom, messageValue, setMessageValue
    } = useChatMessages(messageRef, messagesEndRef, messagesContainerRef, sessionId, hasFirstSignalRMessage, isOnline);
    const uploadImageMutation = useUploadChatFile();
    const scrollToBottomMess = useScrollToBottom(messagesEndRef);
    const { keyboardHeight, keyboardResizeScreen } = useKeyboardResize();
    const { showScrollButton, handleScroll } = useScrollButton(messagesContainerRef);
    useAutoResizeTextarea(messageRef, messageValue);

    const shouldFetchHistory = useMemo(() => {
        if (isWelcome || sessionId) {
            return false;
        }
        return true;
    }, [isWelcome, sessionId]);

    const { chatHistory, isLoading: isLoadingHistory } = useChatHistoryLastModule(
        parseInt(type || "0", 10),
        shouldFetchHistory
    );



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

    const mergedMessages = mergeMessages(
        messages,
        signalRMessages,
        pendingMessages,
        pendingImages,
        pendingFiles
    );

    const getCodeByTopic = useMemo(() => {
        return (topicId: number): string | undefined => {
            const chatItem = chatHistory.find(item => item.topic === topicId);
            return chatItem?.code;
        };
    }, [chatHistory, type]);

    // ==== Lifecycle Effects ====
    useEffect(() => {
        if (sessionId && !isLoading) clearPendingMessages();
    }, [isLoading]);

    useEffect(() => {
        if (!isValidTopicType) history.push("/home");
        if (messagesEndRef.current) {
            scrollToBottomMess();
        }
    }, [isValidTopicType, history, messages, debouncedLoading]);

    useEffect(() => {
        setPendingMessages((prev) =>
            prev.filter((pending) =>
                !messages.some((msg) =>
                    msg.text?.trim() === pending.text?.trim() &&
                    Math.abs(dayjs(msg.createdAt).valueOf() - dayjs(pending.createdAt).valueOf()) < 5000
                )
            )
        );
    }, [messages]);

    useEffect(() => {
        if (messagesEndRef.current) scrollToBottomMess();
    }, [signalRMessages, type, pendingBarHeight]);

    useEffect(() => {
        if (
            prevSessionIdRef.current !== sessionId &&
            prevSessionIdRef.current && sessionId &&
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
            clearSession();
        };
    }, [sessionId, type]);

    useEffect(() => {
        if (pendingBarRef.current) {
            setPendingBarHeight(pendingBarRef.current.offsetHeight + 20);
        }
    }, [pendingImages, pendingFiles]);

    useEffect(() => {
        if (topicType === TopicType.Chat) {
            setDebouncedLoading(false);
            return;
        }
        const currentPath = window.location.pathname;
        const isNavigationFromTopicOnly = currentPath.includes('/chat/') &&
            currentPath.split('/').length === 4 &&
            chatHistory.length > 0;

        // const shouldLoad = sessionId ?
        //     isLoading : // Chỉ cần chờ messages load khi có sessionId
        //     isLoadingHistory;

        if (isLoadingHistory && !sessionId) {
            setDebouncedLoading(true);
        } else {
            const timer = setTimeout(() => {
                setDebouncedLoading(false);
                if (mergedMessages.length > 0 && !isNavigationFromTopicOnly) {
                    setTimeout(() => scrollToBottomMess(), 100);
                }
            }, 100);
            if (!sessionId && chatHistory.length > 0) {
                const code = getCodeByTopic(parseInt(type || "0", 10));
                if (code) {
                    const expectedPath = `/chat/${type}/${code}`;
                    const currentPath = window.location.pathname;
                    if (currentPath !== expectedPath && currentPath === `/chat/${type}`) {
                        console.log("One-time navigation:", currentPath, "→", expectedPath);
                        history.replace(expectedPath);
                    }
                }
            }

            return () => clearTimeout(timer);
        }
    }, [isLoadingHistory, isLoading, type,]);

    useAppState(() => {
        if (sessionId) queryClient.invalidateQueries(["messages", sessionId]);
    });

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
            {
                debouncedLoading ? (
                    <div className="flex flex-col justify-center items-center h-full bg-white">
                        <IonSpinner
                            name="crescent"
                            color="primary"
                            className="w-8 h-8 mb-4"
                        />
                        <p className="text-gray-500 text-sm">{t("Loading messages...")}</p>
                    </div>
                ) : (
                    <>
                        <div
                            className={`flex-1  ${!isWelcome && ("overflow-y-auto")}  p-6 ${!isNative && !keyboardResizeScreen ? ("pb-2 max-h-[calc(100dvh-246px)]") : ""}`}
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
                                    isNative={isNative}
                                    isDesktop={isDesktop}
                                    uploadLoading={imageLoading}
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
                            <div style={{ marginTop: pendingBarHeight }} />
                            <div ref={messagesEndRef} className="mt-4" />
                        </div>
                        {!isWelcome && (
                            <div className={` bg-white pb-4  w-full shadow-[0px_-3px_10px_0px_#0000000D] ${keyboardResizeScreen ? "fixed" : !isNative && "fixed"} ${isNative ? "bottom-0" : "bottom-[76px]"} ${keyboardResizeScreen && !isNative ? "!bottom-0" : ""}`}>
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
                                <div className="pt-4 px-6">
                                    <div ref={pendingBarRef} className="flex  gap-2 flex-wrap">
                                        <PendingImages
                                            pendingImages={pendingImages}
                                            imageLoading={uploadImageMutation.isLoading}
                                            removePendingImage={removePendingImage}
                                            imageLoadingMany={imageLoading}
                                        />
                                        <PendingFiles
                                            pendingFiles={pendingFiles}
                                            removePendingFile={removePendingFile}
                                        />
                                    </div>
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
                                    isNative={isNative}
                                    isDesktop={isDesktop}
                                    imageLoading={uploadImageMutation.isLoading}
                                    imageLoadingMany={imageLoading}
                                />
                            </div>
                        )}
                    </>
                )
            }
        </div>
    );
};

export default Chat;

