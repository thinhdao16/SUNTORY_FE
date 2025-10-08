/* eslint-disable no-extra-boolean-cast */
/* eslint-disable @typescript-eslint/no-explicit-any */
// ================== Imports ==================
import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { Capacitor } from "@capacitor/core";
import { useQueryClient } from "react-query";

import { TopicType, TopicTypeLabel } from "@/constants/topicType";
import { topicFallbackSuggestions } from "@/constants/topicFallbackSuggestions";
import { t } from "@/lib/globalT";

import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useChatStreamMessages } from "./hooks/useChatStreamMessages";
import { useKeyboardResize } from "@/hooks/useKeyboardResize";
import { useScrollButton } from "@/hooks/useScrollButton";
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

import ChatInputBar from "./components/ChatStreamInputBar";
import PendingFiles from "./components/PendingFiles";
import PendingImages from "./components/PendingImages";
import { ChatStreamMessageList } from "./components/ChatStreamMessageList";

import "./ChatStream.module.css";
import { IoArrowDown, IoArrowForward } from "react-icons/io5";
import { useChatHistoryLastModule } from "./hooks/useChatStreamHistorylastModule";
import { IonSpinner } from "@ionic/react";
import { mergeMessagesStream } from "@/utils/mapSignalRStreamMessage ";
import { MessageState, StreamMsg } from "@/types/chat-message";
import { useSignalRChatStore } from "@/store/zustand/signalr-chat-store";
import { useToastStore } from "@/store/zustand/toast-store";
import BackDefaultIcon from "@/icons/logo/back.svg?react";
import { useSignalRStream } from "@/hooks/useSignalRStream";
import NextDefaultIcon from "@/icons/logo/next-default.svg?react";

dayjs.extend(utc);

const Chat: React.FC = () => {
    // ==== Router & Params ====
    const { type, sessionId } = useParams<{ sessionId?: string; type?: string }>();
    const location = useLocation<{ actionFrom?: string }>();
    const history = useHistory();
    const queryClient = useQueryClient();

    // Ensure sessionId is a string
    const sessionIdString = useMemo(() => {
        if (typeof sessionId === 'string') {
            return sessionId;
        } else if (sessionId && typeof sessionId === 'object') {
            // If sessionId is somehow an object, try to extract string value
            return String(sessionId);
        }
        return sessionId;
    }, [sessionId]);

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
    const messagesEndRef = useRef<any>(null);
    const messagesContainerRef = useRef<any>(null);
    const prevSessionIdRef = useRef<string | undefined>(sessionId);
    const prevTypeRef = useRef<string | undefined>(type);
    const pendingBarRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef(0);

    const initialAutoScrollRef = useRef(true);
    const prependPrevHRef = useRef<number | null>(null);
    const prependPrevTRef = useRef<number | null>(null);
    const prevFetchingRef = useRef(false);
    // ==== Stores ====
    const showToast = useToastStore.getState().showToast;

    const {
        pendingImages, pendingFiles,
        addPendingImages, addPendingFiles,
        removePendingImage, removePendingFile,
        clearAll, removePendingImageByUrl,
        replacePendingImage,
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
    const addStreamChunk = useSignalRStreamStore((state) => state.addStreamChunk);
    const { loadingStream } = useSignalRStreamStore()
    const completedMessages = useMemo(() => {
        if (!sessionIdString) return [];
        return rawCompleted.filter((msg: any) => msg.chatCode === sessionIdString);
    }, [rawCompleted, sessionIdString]);
    
    const activeStreamsCount = useMemo(() => {
        return signalRMessages.filter(msg =>
            msg.chatCode === sessionIdString &&
            msg.isStreaming &&
            !msg.isComplete
        ).length;
    }, [signalRMessages, sessionIdString]);
    
    useEffect(() => {
        if (activeStreamsCount > 0) {
            console.log(`[ChatStream] ${activeStreamsCount} active streams for session ${sessionIdString}`);
        }
    }, [activeStreamsCount, sessionIdString]);

    const signalRMessagesBackUp = useMemo(() =>
        allSignalRMessages.filter((msg: any) => msg.chatInfo?.code === sessionIdString || msg.code === sessionIdString),
        [allSignalRMessages, sessionIdString]
    );
    const dataBackUpMap = useMemo<Record<string, StreamMsg>>(() => {
        return signalRMessagesBackUp.reduce((acc: any, msg: any) => {
            const messageCode = msg.code;
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
    const anActivate = topicType === TopicType.MedicalSupport || topicType === TopicType.DocumentTranslation || topicType === TopicType.FoodDiscovery;
    // ==== Hooks: Chat & Message ====
    // useSignalRChat(deviceInfo.deviceId || "");
    useSignalRStream(deviceInfo.deviceId || "", sessionIdString, {
        logLevel: 0,
    });
    const uploadImageMutation = useUploadChatFile();
    const scrollToBottomMess = useScrollToBottom(messagesEndRef);
    const { keyboardHeight, keyboardResizeScreen } = useKeyboardResize();
    const { showScrollButton, onContainerScroll, recalc } = useScrollButton(messagesContainerRef, messagesEndRef);
    const [isPinnedBottom, setIsPinnedBottom] = useState(true);
    const {
        lastPage,
        messages,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        handleScrollLoadMore,
        scrollToBottom,
        messageValue,
        setMessageValue,
    } = useChatStreamMessages(messageRef, messagesEndRef, messagesContainerRef, sessionIdString, false, isOnline, recalc);




    const shouldFetchHistory = useMemo(() => {
        if (sessionIdString) {
            return false;
        }
        return true;
    }, [sessionIdString]);

    const { chatHistory, isLoading: isLoadingHistory, refreshHistory } = useChatHistoryLastModule(
        parseInt(type || "0", 10),
        shouldFetchHistory
    );
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
        sessionId: sessionIdString,
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
        replacePendingImage,
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

    const handleSendForRetry = useCallback((e: any, messageText?: string) => {
        (handleSendMessage as any)(e, true, messageText);
    }, [handleSendMessage]);

    const { retryMessage } = useMessageRetry(
        handleSendForRetry,
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

    const quickSuggestions = useMemo(() => {
        try {
            const topicId = parseInt(type || "0", 10);
            const bySession = sessionIdString ? (chatHistory || []).find((it: any) => it?.code === sessionIdString) as any : undefined;
            const byTopic = (chatHistory || []).slice().reverse().find((it: any) => Number(it?.topic) === Number(topicId)) as any;
            const src = (bySession || byTopic) as any;
            const arr = Array.isArray(src?.questionRecomment) ? src.questionRecomment : [];
            const cleaned = arr.filter((s: any) => typeof s === 'string' && s.trim());
            if (cleaned.length > 0) return cleaned.slice(0, 3) as string[];
            const fallback = topicFallbackSuggestions[topicId] || [];
            return fallback.slice(0, 3);
        } catch {
            return [] as string[];
        }
    }, [chatHistory, sessionIdString, type]);

    const prevCompletedCountRef = useRef(0);
    useEffect(() => {
        if (completedMessages.length > prevCompletedCountRef.current) {
            try { refreshHistory?.(); } catch {}
        }
        prevCompletedCountRef.current = completedMessages.length;
    }, [completedMessages.length, refreshHistory]);

    useEffect(() => {
        if (sessionIdString && (quickSuggestions.length === 0)) {
            try { refreshHistory?.(); } catch {}
        }
    }, [sessionIdString]);

    const handleQuickSuggestionClick = useCallback((q: string) => {
        if (!q) return;
        setMessageValue(q);
        try {
            (handleSendMessage as any)({ preventDefault() {}, stopPropagation() {} }, true, q);
        } catch {}
    }, [handleSendMessage, setMessageValue]);

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

    const forceScrollToBottomNow = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, []);

    const forceScrollToBottomSmooth = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    const autoScrollIfNeeded = useCallback(() => {
        if (isPinnedBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [isPinnedBottom]);

    const scrollToBottomIfPinned = useCallback(() => {
        if (isPinnedBottom) {
            scrollToBottom();
        }
    }, [isPinnedBottom, scrollToBottom]);

    useEffect(() => {
        const currentSessionMessages = signalRMessages.filter(msg => msg.chatCode === sessionIdString);
        if (currentSessionMessages.length > 0) {
            if (isPinnedBottom) {
                setTimeout(forceScrollToBottomSmooth, 100);
            }
        }
    }, [signalRMessages, sessionIdString, isPinnedBottom, forceScrollToBottomSmooth]);

    useEffect(() => {
        if (!isValidTopicType) history.push("/home");
    }, [isValidTopicType, history]);

    useEffect(() => {
        if (!sessionIdString) {
            return;
        }

        const allStreams = Object.values(useSignalRStreamStore.getState().streamMessages);
        const staleStreams = allStreams.filter(stream => {
            const isStale = Date.now() - new Date(stream.startTime).getTime() > 5 * 60 * 1000;
            const isDifferentSession = stream.chatCode !== sessionIdString;
            return isStale || isDifferentSession;
        });

        if (staleStreams.length > 0) {
            staleStreams.forEach(stream => {
                useSignalRStreamStore.getState().clearStream(stream.messageCode);
            });
        }
    }, [sessionIdString]); 

    useEffect(() => {
        if (prevSessionIdRef.current !== sessionIdString) {
            if (prevSessionIdRef.current) {
                const prevSessionStreams = signalRMessages.filter(msg =>
                    msg.chatCode === prevSessionIdRef.current
                );
                prevSessionStreams.forEach(stream => {
                    useSignalRStreamStore.getState().clearStream(stream.messageCode);
                });
            }

            initialAutoScrollRef.current = true;
            prevSessionIdRef.current = sessionIdString;
        }
    }, [sessionIdString, signalRMessages]);

    useEffect(() => {
        if (!sessionIdString) return;
        if (!initialAutoScrollRef.current) return;

        const ready = !isLoading && mergedMessages.length > 0;
        if (!ready) return;

        forceScrollToBottomNow();
        setTimeout(forceScrollToBottomNow, 0);

        initialAutoScrollRef.current = false;
    }, [sessionIdString, isLoading, mergedMessages.length, forceScrollToBottomNow]);

    useEffect(() => {
        autoScrollIfNeeded();
    }, [mergedMessages, autoScrollIfNeeded]);

    useEffect(() => {
        autoScrollIfNeeded();
    }, [signalRMessages, autoScrollIfNeeded]);

    useEffect(() => {
        if (messages.length === 0 || messages.length === prevMessagesLengthRef.current) {
            prevMessagesLengthRef.current = messages.length;
            return;
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages]);

    useEffect(() => {
        autoScrollIfNeeded();
    }, [type, pendingBarHeight, autoScrollIfNeeded]);

    useEffect(() => {
        const c = messagesContainerRef.current as HTMLElement | null;
        const wasFetching = prevFetchingRef.current;
        const nowFetching = !!isFetchingNextPage;
        if (!wasFetching && nowFetching) {
            if (c) {
                prependPrevHRef.current = c.scrollHeight;
                prependPrevTRef.current = c.scrollTop;
            }
        }
        if (wasFetching && !nowFetching) {
            requestAnimationFrame(() => {
                const c2 = messagesContainerRef.current as HTMLElement | null;
                if (c2 && prependPrevHRef.current != null && prependPrevTRef.current != null) {
                    const newH = c2.scrollHeight;
                    const delta = newH - prependPrevHRef.current;
                    c2.scrollTop = prependPrevTRef.current + delta;
                }
                prependPrevHRef.current = null;
                prependPrevTRef.current = null;
                recalc();
            });
        }
        prevFetchingRef.current = nowFetching;
    }, [isFetchingNextPage, recalc]);

    useEffect(() => {
        if (topicType === TopicType.Chat) {
            setDebouncedLoading(false);
            return;
        }
        const currentPath = window.location.pathname;
        const isNavigationFromTopicOnly =
            currentPath.includes("/chat/") &&
            currentPath.split("/").length === 4 &&
            chatHistory.length > 0;

        if (!sessionIdString) {
            const timer = setTimeout(() => {
                setDebouncedLoading(false);
                if (mergedMessages.length > 0 && !isNavigationFromTopicOnly) {
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                }
            }, 100);
            if (!sessionIdString && chatHistory.length > 0) {
                const code = getCodeByTopic(parseInt(type || "0", 10));
                if (code) {
                    const expectedPath = `/chat/${type}/${code}`;
                    const currentPath2 = window.location.pathname;
                    if (currentPath2 !== expectedPath && currentPath2 === `/chat/${type}`) {
                        history.replace(expectedPath);
                    }
                }
            }
            return () => clearTimeout(timer);
        }
    }, [isLoadingHistory, isLoading, type]);

    useEffect(() => {
        if (!!location.state?.actionFrom) {
            setActionFrom(location.state.actionFrom);
        }
    }, [location.state?.actionFrom]);

useEffect(() => { recalc(); }, [mergedMessages.length]);
useEffect(() => { recalc(); }, [keyboardHeight]);
useEffect(() => { recalc(); }, []); 
useEffect(() => { recalc(); }, [quickSuggestions.length]);

    useAppState(() => {
        if (sessionIdString) queryClient.invalidateQueries(["messages", sessionIdString]);
    });

    return (
        <div
            className="relative flex flex-col bg-white"
            style={{
                paddingRight: 0,
                paddingLeft: 0,
                paddingBottom: keyboardHeight > 0 ? (keyboardResizeScreen ? 60 : keyboardHeight) : 60,
                height: "100dvh",
                // paddingTop: "var(--safe-area-inset-top, 0px)",
            }}
        >
            <div className="relative flex items-center justify-between px-6 h-[50px]">
                <div className="flex items-center gap-4 z-10">
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
                        <BackDefaultIcon  />
                    </button>

                </div>

                <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
                    <span className="font-semibold text-main uppercase tracking-wide text-center">
                        {t(title || "")}
                    </span>
                </div>

                {/* <div className="flex items-center justify-end z-10">
                    <>
                        <button onClick={() => openSidebarWithAuthCheck()} aria-label="Sidebar">
                            <NavBarHomeHistoryIcon />
                        </button>
                    </>
                </div> */}
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
                            className={`flex-1 overflow-x-hidden overflow-y-auto p-6 ${!isNative && !keyboardResizeScreen ? `pb-2 overflow-hidden` : ""}`}
                            ref={messagesContainerRef}
                            onScroll={() => {
                                onContainerScroll?.();
                                const c = messagesContainerRef.current as HTMLElement | null;
                                if (c) {
                                    const distance = Math.max(0, c.scrollHeight - Math.ceil(c.scrollTop + c.clientHeight));
                                    if (distance > 8) {
                                        if (isPinnedBottom) setIsPinnedBottom(false);
                                    } else {
                                        if (!isPinnedBottom) setIsPinnedBottom(true);
                                    }
                                }
                                handleScrollLoadMore();
                            }}
                        >
                            <ChatStreamMessageList
                                lastPage={lastPage}
                                allMessages={mergedMessages}
                                pendingMessages={pendingMessages}
                                topicType={topicType}
                                title={title}
                                loading={isSending || hasPendingMessages}
                                // loading={loadingStream.loading || isSending}
                                onRetryMessage={retryMessage}
                                isSpending={isSending || hasPendingMessages}
                                thinkLoading={isSending || hasPendingMessages}
                                scrollToBottom={scrollToBottomIfPinned}
                                isLoadingMessages={isLoading || debouncedLoading}
                            />
                            {!(isSending || hasPendingMessages || loadingStream.loading || activeStreamsCount > 0) && (isLoadingHistory || quickSuggestions.length > 0) && (
                                <div className="mt-4">
                                    <div className="text-xs text-gray-400 mb-2">{t('Try saying...')}</div>
                                    {isLoadingHistory && quickSuggestions.length === 0 ? (
                                        <div className="flex flex-col gap-2">
                                            <div className="h-11 rounded-xl bg-gray-100 animate-pulse" />
                                            <div className="h-11 rounded-xl bg-gray-100 animate-pulse" />
                                            <div className="h-11 rounded-xl bg-gray-100 animate-pulse" />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {quickSuggestions.map((q, idx) => (
                                                <button
                                                    key={idx}
                                                    className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 text-left "
                                                    onClick={() => handleQuickSuggestionClick(q)}
                                                    disabled={isSending || hasPendingMessages}
                                                >
                                                    <span className="text-sm text-gray-800">{q}</span>
                                                    <NextDefaultIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div style={{ marginTop: pendingBarHeight }} />
                            {/* {!isNative && (<div className={`h-25 lg:h-0 xl:h-15`} />)} */}
                            <div ref={messagesEndRef} className="h-px mt-auto shrink-0" />
                        </div>
                        <div className={`bg-white w-full shadow-[0px_-3px_10px_0px_#0000000D] ${keyboardResizeScreen ? "fixed" : !isNative && "sticky"
                            } ${isNative ? "bottom-0" : "bottom-[60px]"
                            } ${keyboardResizeScreen && !isNative ? "!bottom-0" : ""
                            } ${keyboardResizeScreen && isNative ? "pb-4" : "pb-4"}`}>
                            <div className="relative">

                                {showScrollButton && (
                                    <div className="absolute top-[-42px] left-1/2 transform -translate-x-1/2">
                                        <button
                                            className="p-2.5 rounded-full shadow bg-white"
                                            onClick={() => { setIsPinnedBottom(true); scrollToBottom(); }}
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
                                    // isLoading={isLoading}
                                    isLoading={loadingStream.loading || isSending || hasPendingMessages}
                                    isLoadingHistory={isLoadingHistory}
                                    messageRef={messageRef}
                                    handleSendMessage={handleSendMessage}
                                    handleImageChange={handleImageChange}
                                    handleFileChange={handleFileChange}
                                    onTakePhoto={() => history.push("/camera")}
                                    isSpending={isSending || hasPendingMessages}
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

                        </div>
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
