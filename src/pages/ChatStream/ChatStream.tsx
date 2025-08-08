/* eslint-disable no-extra-boolean-cast */
/* eslint-disable @typescript-eslint/no-explicit-any */
// ================== Imports ==================
import React, { useRef, useEffect, useState, useMemo } from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { Capacitor } from "@capacitor/core";
import { useQueryClient } from "react-query";

import { TopicType, TopicTypeLabel } from "@/constants/topicType";
import { t } from "@/lib/globalT";

import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useChatStreamMessages } from "./hooks/useChatStreamMessages";
import { useKeyboardResize } from "@/hooks/useKeyboardResize";
import { useScrollButton } from "@/hooks/useScrollButton";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import { useUploadChatFile } from "@/hooks/common/useUploadChatFile";
import { useAppState } from "@/hooks/useAppState";
import useNetworkStatus from "@/hooks/useNetworkStatus";
import { useChatStreamHandlers } from "./hooks/useChatStreamHandlers";
import { useSignalRStreamStore } from "@/store/zustand/signalr-stream-store";
import { useMessageRetry } from "@/hooks/useMessageRetry";

import { useChatStore } from "@/store/zustand/chat-store";
import { useImageStore } from "@/store/zustand/image-store";
import { useUploadStore } from "@/store/zustand/upload-store";
import { openSidebarWithAuthCheck } from "@/store/zustand/ui-store";

import ChatInputBar from "./components/ChatStreamInputBar";
import PendingFiles from "./components/PendingFiles";
import PendingImages from "./components/PendingImages";
import { ChatStreamMessageList } from "./components/ChatStreamMessageList";
import ChatWelcomePanel from "./components/ChatStreamWelcomePanel";
import NavBarHomeHistoryIcon from "@/icons/logo/nav_bar_home_history.svg?react";

import "./ChatStream.module.css";
import { IoArrowBack, IoArrowDown } from "react-icons/io5";
import { useChatHistoryLastModule } from "./hooks/useChatStreamHistorylastModule";
import { IonSpinner } from "@ionic/react";
import { mergeMessagesStream } from "@/utils/mapSignalRStreamMessage ";
import { MessageState, StreamMsg } from "@/types/chat-message";
import { useSignalRChatStore } from "@/store/zustand/signalr-chat-store";
import { useToastStore } from "@/store/zustand/toast-store";
import { useSignalRChat } from "@/hooks/useSignalRChat";
import { useSignalRStream } from "@/hooks/useSignalRStream";

dayjs.extend(utc);

const Chat: React.FC = () => {
    // ==== Router & Params ====
    const { type, sessionId } = useParams<{ sessionId?: string; type?: string }>();
    const location = useLocation<{ actionFrom?: string }>();
    const history = useHistory();
    const queryClient = useQueryClient();

    // ==== Device & Platform ====
    const deviceInfo: { deviceId: string | null, language: string | null } = useDeviceInfo();
    const isNative = Capacitor.isNativePlatform();
    const isOnline = useNetworkStatus();
    const isDesktop = typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

    // ==== State ====
    const [pendingBarHeight, setPendingBarHeight] = useState(0);
    const [messageRetry, setMessageRetry] = useState<string>("");
    // Thêm state để debounce loading
    const [debouncedLoading, setDebouncedLoading] = useState(false);

    const [actionFrom, setActionFrom] = useState<string | undefined>('');

    // ==== Refs ====
    const messageRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const prevSessionIdRef = useRef<string | undefined>(sessionId);
    const prevTypeRef = useRef<string | undefined>(type);
    const pendingBarRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef(0);

    // ==== Stores ====
    const showToast = useToastStore.getState().showToast;

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
    const allSignalRMessages = useSignalRChatStore((s: any) => s.messages);
    const setSignalRMessagesBackUp = useSignalRChatStore((s) => s.setMessages);

    // ==== Stream Integration ====
    const signalRMessages = Object.values(useSignalRStreamStore((state) => state.streamMessages));
    const rawCompleted = useSignalRStreamStore(state => state.completedMessages);
    const clearAllStreams = useSignalRStreamStore((state) => state.clearAllStreams);
    const setChatCode = useSignalRStreamStore((state) => state.setChatCode);

    const completedMessages = useMemo(() => {
        if (!sessionId) return [];
        return rawCompleted.filter((msg: any) => msg.chatCode === sessionId);
    }, [rawCompleted, sessionId]);

    const signalRMessagesBackUp = useMemo(() =>
        allSignalRMessages.filter((msg: any) => msg.chatInfo?.code === sessionId || msg.code === sessionId),
        [allSignalRMessages, sessionId]
    );

    const dataBackUpMap = useMemo<Record<string, StreamMsg>>(() => {
        return signalRMessagesBackUp.reduce((acc: any, msg: any) => {
            const messageCode = msg.code;         // key
            const chatCode = msg.chatInfo?.code ?? msg.chatInfoId;
            const text = msg.completeText ?? msg.messageText;
            const time = msg.startTime ?? msg.createDate;

            acc[messageCode] = {
                messageCode,
                chatCode,
                chunks: msg.chunks ?? [],
                isStreaming: msg.isStreaming ?? false,
                isComplete: msg.isComplete ?? true,
                hasError: msg.hasError ?? false,
                completeText: text,
                startTime: time,
                code: msg.code,
                id: msg.id,
                userMessageId: msg.userChatMessage?.id ?? msg.replyToMessageId,
                endTime: msg.endTime ?? time,
            };
            return acc;
        }, {} as Record<string, StreamMsg>);
    }, [signalRMessagesBackUp]);

    // ==== Derived State ====
    const topicTypeNum = type ? Number(type) : undefined;
    const isValidTopicType = topicTypeNum !== undefined && Object.values(TopicType).includes(topicTypeNum as TopicType);
    const topicType: TopicType | undefined = isValidTopicType ? (topicTypeNum as TopicType) : undefined;
    const title = isValidTopicType && topicType !== undefined ? TopicTypeLabel[topicType] : undefined;
    const isWelcome = topicType === TopicType.Chat && !sessionId && pendingMessages.length === 0;
    const anActivate = topicType === TopicType.MedicalSupport
    // ==== Hooks: Chat & Message ====
    useSignalRChat(deviceInfo.deviceId || "");
    useSignalRStream(deviceInfo.deviceId || "", {
        autoReconnect: true,
        logLevel: 0,
    });
    const {
        messages,
        isLoading,
        scrollToBottom,
        messageValue,
        setMessageValue
    } = useChatStreamMessages(messageRef, messagesEndRef, messagesContainerRef, sessionId, false, isOnline);


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
    } = useChatStreamHandlers({
        addPendingImages,
        addPendingFiles,
        setPendingMessages,
        setSignalRMessages: () => { },
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
        setHasFirstSignalRMessage: () => { },
        deviceInfo,
        stopMessages,
        setStopMessages,
        removePendingImageByUrl,
        messageRetry,
        setMessageRetry
    });
    const mergedMessages = useMemo(() => {
        const raw = mergeMessagesStream(
            [...completedMessages, ...messages],
            // messages,
            [...signalRMessages, ...Object.values(dataBackUpMap)],
            // signalRMessages,
            pendingMessages,
            pendingImages,
            pendingFiles
        );
        const seen = new Set<string>();
        return raw.filter(msg => {
            const key = msg.id != null
                ? String(msg.id)
                : String(msg.messageCode ?? msg.timeStamp);
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }, [signalRMessages, pendingMessages, pendingImages, pendingFiles, signalRMessagesBackUp, messages, completedMessages, dataBackUpMap]);

    const { retryMessage } = useMessageRetry(
        handleSendMessage,
        setMessageValue,
        addPendingImages,
        addPendingFiles,
        mergedMessages,
        setMessageRetry,
        pendingImages,
        pendingFiles
    );
    const getCodeByTopic = useMemo(() => {
        return (topicId: number): string | undefined => {
            const chatItem = chatHistory
                .slice()
                .reverse()
                .find(item => item.topic === topicId);
            return chatItem?.code;
        };
    }, [chatHistory, type]);

    const hasPendingMessages = useMemo(() => {
        return mergedMessages.some(msg =>
            msg.text === MessageState.PENDING ||
            msg.messageState === MessageState.PENDING ||
            msg.text === 'PENDING_MESSAGE'
        );
    }, [mergedMessages]);

    const clearAllMessages = () => {
        useChatStore.getState().clearPendingMessages();
        useChatStore.getState().clearMessages();
        useChatStore.getState().clearSession();
        useChatStore.getState().setStopMessages(true);
        useSignalRChatStore.getState().setHasFirstSignalRMessage(false);
        useSignalRChatStore.getState().setMessages([]);
        useSignalRStreamStore.getState().clearAllStreams();
    };

    // ==== Lifecycle Effects ====

    useEffect(() => {
        if (sessionId && !isLoading) {
            clearPendingMessages();
            clearAllStreams();
        }
    }, [isLoading]);

    useEffect(() => {
        if (!isValidTopicType) history.push("/home");
        if (messagesEndRef.current) {
            scrollToBottomMess();
        }
    }, [isValidTopicType, history, messages, debouncedLoading]);


    useEffect(() => {
        if (messages.length === 0 || messages.length === prevMessagesLengthRef.current) {
            prevMessagesLengthRef.current = messages.length;
            return;
        }

        prevMessagesLengthRef.current = messages.length;

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
    }, [type, pendingBarHeight, scrollToBottomMess]);

    useEffect(() => {
        if (
            prevSessionIdRef.current !== sessionId &&
            prevSessionIdRef.current && sessionId &&
            prevSessionIdRef.current.split("/")[0] !== sessionId.split("/")[0]
        ) {
            clearPendingMessages();
            clearAllStreams();
            setSignalRMessagesBackUp?.([]);
        }

        prevSessionIdRef.current = sessionId;
        prevTypeRef.current = type;
        if (sessionId) {
            setChatCode(sessionId);
        } else {
            setChatCode('');
        }
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

        if (!sessionId) {
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
                        history.replace(expectedPath);
                    }
                }
            }

            return () => clearTimeout(timer);
        }
    }, [isLoadingHistory, isLoading, type,]);

    useEffect(() => {
        if (!!location.state?.actionFrom) {
            setActionFrom(location.state.actionFrom);
        }
    }, [location.state?.actionFrom]);

    useAppState(() => {
        if (sessionId) queryClient.invalidateQueries(["messages", sessionId]);
    });

    return (
        <div
            className="relative flex flex-col bg-white"
            style={{
                paddingRight: 0,
                paddingLeft: 0,
                paddingBottom: !isWelcome ? (keyboardHeight > 0 ? (keyboardResizeScreen ? 60 : keyboardHeight) : 60) : 0,
                height: "100dvh",
                // paddingTop: "var(--safe-area-inset-top, 0px)",
            }}
        >
            <div className="relative flex items-center justify-between px-6 h-[50px]">
                {/* Cột trái */}
                <div className="flex items-center gap-4 z-10">
                    {!isWelcome && (
                        <button
                            onClick={() => {
                                clearAllMessages();
                                if (!!actionFrom) {
                                    history.push(actionFrom);
                                } else {
                                    history.goBack();
                                }
                            }}
                            aria-label="Back"
                        >
                            <IoArrowBack size={20} className="text-blue-600" />
                        </button>
                    )}
                    {isWelcome && (
                        <button onClick={() => openSidebarWithAuthCheck()} aria-label="Sidebar">
                            <NavBarHomeHistoryIcon />
                        </button>
                    )}
                </div>

                {(!isWelcome) && (
                    <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
                        <span className="font-semibold text-main uppercase tracking-wide text-center">
                            {t(title || "")}
                        </span>
                    </div>
                )}

                <div className="flex items-center justify-end z-10">
                    {!isWelcome && (
                        <>
                            <button onClick={() => openSidebarWithAuthCheck()} aria-label="Sidebar">
                                <NavBarHomeHistoryIcon />
                            </button>
                        </>
                    )}
                </div>
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
                            className={`flex-1 overflow-x-hidden ${!isWelcome && ("overflow-y-auto")} p-6 ${isWelcome ? "max-h-(100%) pb-40 overflow-y-hidden" : (!isNative && !keyboardResizeScreen ? ("pb-2 max-h-[calc(100dvh-218px)] overflow-hidden") : "")
                                }`}
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
                                <ChatStreamMessageList
                                    allMessages={mergedMessages}
                                    pendingMessages={pendingMessages}
                                    topicType={topicType}
                                    title={title}
                                    loading={isSending || hasPendingMessages}
                                    onRetryMessage={retryMessage}
                                    isSpending={isSending}
                                />
                            )}
                            <div style={{ marginTop: pendingBarHeight }} />
                            <div ref={messagesEndRef} className="mt-4" />
                        </div>
                        {!isWelcome && (
                            <div className={`bg-white w-full shadow-[0px_-3px_10px_0px_#0000000D] ${keyboardResizeScreen ? "fixed" : !isNative && "fixed"
                                } ${isNative ? "bottom-0" : "bottom-[60px]"
                                } ${keyboardResizeScreen && !isNative ? "!bottom-0" : ""
                                } ${keyboardResizeScreen && isNative ? "pb-4" : "pb-4"}`}>
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
                                    isLoading={isLoading || hasPendingMessages}
                                    isLoadingHistory={isLoadingHistory}
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
                                    anActivate={anActivate}
                                    showToast={showToast}
                                />
                            </div>
                        )}
                    </>
                )
            }

            {/* {isLoadingHistory && (
                <div className="absolute top-0 left-0 right-0 bottom-0 z-[200] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
                    <IonSpinner name="crescent" color="primary" className="w-8 h-8 mb-4" />
                    <p className="text-gray-500 text-sm">{t("Loading messages...")}</p>
                </div>
            )} */}
        </div>
    );
};

export default Chat;
