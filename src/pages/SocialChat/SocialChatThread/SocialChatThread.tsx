import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useKeyboardResize } from "@/hooks/useKeyboardResize";
import { useScrollButton } from "@/hooks/useScrollButton";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import { useUploadChatFile } from "@/hooks/common/useUploadChatFile";
import { useAppState } from "@/hooks/useAppState";
import { useUpdateSocialChatMessage, useRevokeSocialChatMessage } from "../hooks/useSocialChat";
import { useSocialChatMessages } from "../hooks/useSocialChat";

import ChatInputBar from "./components/ChatInputBar";
import SocialChatHeader from "./components/SocialChatHeader";
import ChatRelationshipBanner from "./components/ChatRelationshipBanner";
import MotionStyles from "@/components/common/bottomSheet/MotionStyles";
import MotionBottomSheet from "@/components/common/bottomSheet/MotionBottomSheet";
import LanguageSelectModal from "@/components/common/bottomSheet/LanguageInutModal";

import { IoArrowDown } from "react-icons/io5";
import { useSocialChatThread } from "./hooks/useSocialChatThread";
import { ChatInfoType, CountLimitChatDontFriend } from "@/constants/socialChat";
import { mergeSocialChatMessages } from "@/utils/mapSocialChatMessage";
import { ChatMessageList } from "./components/ChatMessageList";
import { useSocialChatHandlers } from "./hooks/useSocialChatHandlers";
import { ChatMessage } from "@/types/social-chat";
import MessageLimitNotice from "./components/MessageLimitNotice";
import ExpandInputModal from "@/components/common/bottomSheet/ExpandInputModal";
import { useCompensateScrollOnFooterChange } from "@/hooks/useCompensateScrollOnFooterChange";
import TypingIndicator from './components/TypingIndicator';
import PendingFilesList, { PendingFile } from "./components/PendingFilesList";
import { usePendingFiles } from "./hooks/usePendingFiles";
import { usePendingFilesHandlers } from "./hooks/usePendingFilesHandlers";

const TypingIndicatorWrapper: React.FC<{
    typingUsers: { userId: number, userName: string, avatar?: string }[];
    onHeightChange: (height: number) => void;
}> = ({ typingUsers, onHeightChange }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const report = () => {
            const h = el.offsetHeight;
            onHeightChange(h);
        };
        const ro = new ResizeObserver(report);
        ro.observe(el);
        report();
        return () => ro.disconnect();
    }, [onHeightChange]);

    useEffect(() => {
        if (!typingUsers.length) {
            onHeightChange(0);
        }
    }, [typingUsers.length, onHeightChange]);

    return (
        <div ref={containerRef}>
            <TypingIndicator typingUsers={typingUsers} />
        </div>
    );
};

dayjs.extend(utc);

const SocialChatThread: React.FC = () => {
    const {
        type, roomId, history, queryClient,
        isNative, isDesktop,
        messageTranslate, setMessageTranslate,
        inputValueTranslate, setInputValueTranslate,
    } = useSocialChatThread();

    const [inputBarHeight, setInputBarHeight] = useState(0);
    const [typingIndicatorHeight, setTypingIndicatorHeight] = useState(0);
    
    const {
        pendingFiles: chatPendingFiles,
        addPendingFile,
        addPendingFiles: addChatPendingFiles,
        updatePendingFile,
        removePendingFile,
        clearPendingFiles,
    } = usePendingFiles();

    const {
        messagesEndRef, messagesContainerRef,
        messageRef, messageTranslateRef,
        translationLanguages, roomChatInfo,
        languagesSocialChat, onSelectSocialChat, setLanguagesSocialChatFromAPI,
        setSelectedLanguageSocialChat, selectedLanguageSocialChat,
        pendingImages, pendingFiles, addPendingImages, addPendingFiles,
        removePendingImageByUrl, showToast,
        userInfo, messages, addMessage, updateMessageByCode, updateMessageByTempId, updateMessageWithServerResponse, setLoadingMessages, addMessages, getLoadingForRoom, updateOldMessagesWithReadStatus,
        replyingToMessage, setReplyingToMessage, clearReplyingToMessage,
        initialLoadRef, prevMessagesLength,
        translateSheet, sheetExpand, openInputExpandSheet, openTranslateExpandSheet, closeSheet, messageValue, setMessageValue,
        unfriendMutation, sendRequest, cancelRequest, acceptRequest, rejectRequest,
        translateActionStatus, setTranslateActionStatus,
        expandValue, setExpandValue, expandTitle, expandPlaceholder, usePeerUserId, roomData, createTranslationMutation, actionFieldSend, isTranslating, sheetExpandMode, typing,
        typingUsers, clearTypingAfterSend,
    } = useSocialChatThread();

    const updateMessageMutation = useUpdateSocialChatMessage();
    const revokeMessageMutation = useRevokeSocialChatMessage();
    const uploadImageMutation = useUploadChatFile();
    const scrollToBottomMess = useScrollToBottom(messagesEndRef, 0, "auto");
    const { keyboardHeight, keyboardResizeScreen } = useKeyboardResize();
    const { showScrollButton, onContainerScroll, recalc } = useScrollButton(messagesContainerRef, messagesEndRef);
    const effectiveFooterHeight = inputBarHeight + (keyboardResizeScreen ? 0 : 0);

    const peerUserId = useMemo(() => usePeerUserId(roomData, userInfo?.id), [roomData, userInfo?.id]);

    const scrollToBottom = useCallback(() => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
                recalc();
            });
        });
    }, [recalc]);



    const {
        data: messagesData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingMessages,
        refetch: refetchMessages,
    } = useSocialChatMessages(roomId || "", 40);

    const serverMessages = useMemo(() => {
        return messagesData?.pages.flat() || [];
    }, [messagesData]);
    const displayMessages = useMemo(() => {
        return mergeSocialChatMessages(
            messages,
            userInfo?.id || 0,
        ).map((msg) => ({
            ...msg,
            botName: msg.botName === null ? undefined : msg.botName,
        }));
    }, [serverMessages, messages, roomId, userInfo]);
    const userRightCount = useMemo(
        () => displayMessages.reduce((acc, m) => {
            if (!m?.isRight) return acc;
            try {
                const parsedMessage = JSON.parse((m as any).messageText);
                if (parsedMessage.Event === "NOTIFY_FRIENDLY_ACCEPTED") {
                    return acc;
                }
            } catch (e) {
            }
            
            return acc + 1;
        }, 0),
        [displayMessages, messages, roomId, userInfo]
    );
    const hasReachedLimit = !roomData?.isFriend && userRightCount >= CountLimitChatDontFriend && roomChatInfo?.type === ChatInfoType.UserVsUser;

    const isSendingMessage = getLoadingForRoom(roomId || "");


    const {
        handleScrollWithLoadMore,
        handleSendMessage: originalHandleSendMessage,
        handleImageChange,
        handleEditMessage,
        handleRevokeMessage,
        handleTakePhoto,
        handleTranslate,
        sendPickedFiles,
    } = useSocialChatHandlers({
        addPendingImages,
        addPendingFiles,
        pendingImages,
        pendingFiles,
        chatPendingFiles,
        clearPendingFiles,
        messageValue,
        setMessageValue,
        uploadImageMutation,
        removePendingImageByUrl,
        scrollToBottom,
        addMessage,
        updateMessageByTempId,
        updateMessageWithServerResponse,
        updateOldMessagesWithReadStatus,
        roomId : roomId ?? "",
        setLoadingMessages,
        onContainerScroll,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage: async () => { await fetchNextPage(); },
        updateMessageByCode,
        displayMessages,
        updateMessageMutation,
        revokeMessageMutation,
        replyingToMessage,
        history,
        clearReplyingToMessage,
        hasReachedLimit,
        selectedLanguageSocialChat,
        createTranslationMutation,
        setMessageTranslate,
        messageTranslate,
        showToast,
        t: (key: string) => key,
        recalc
    });

    const {
        handleSendMessage: handleSendMessageWithPending,
        handleOpenGallery,
        handleRetryUpload,
        handleCameraResult
    } = usePendingFilesHandlers({
        chatPendingFiles,
        addPendingFile,
        updatePendingFile,
        removePendingFile,
        clearPendingFiles,
        uploadImageMutation,
        originalHandleSendMessage,
        clearTypingAfterSend,
        showToast,
        messageValue,
        messageTranslate,
    });

 
    useCompensateScrollOnFooterChange(messagesContainerRef, effectiveFooterHeight, {
        stickToBottomThreshold: 16,
        clampDelta: 800,
    });

    useCompensateScrollOnFooterChange(messagesContainerRef, typingIndicatorHeight, {
        stickToBottomThreshold: 16,
        clampDelta: 200,
    });
    useEffect(() => {
        if (messagesData?.pages) {
            const apiMessages = messagesData.pages.flatMap(page => {
                if (page && typeof page === 'object' && Array.isArray(page)) {
                    return page;
                }
                return [];
            });
            addMessages(apiMessages);
        }
    }, [messagesData]);
    useEffect(() => {
        const isInitial = initialLoadRef.current;
        const isFirstLoad = isInitial && displayMessages.length > 0;

        if (isFirstLoad) {
            setTimeout(() => {
                scrollToBottomMess();
                requestAnimationFrame(() => requestAnimationFrame(() => recalc()));
            }, 200);
            initialLoadRef.current = false;
        }
        prevMessagesLength.current = displayMessages.length;
    }, [displayMessages, scrollToBottomMess, recalc]);
    useEffect(() => {
        if (roomId) {
            refetchMessages();
        }
    }, [roomId, refetchMessages]);

    useEffect(() => {
        if (messagesEndRef.current) scrollToBottomMess();
    }, [type, scrollToBottomMess]);
    useEffect(() => {
        if (translationLanguages && translationLanguages.length > 0) {
            setLanguagesSocialChatFromAPI(translationLanguages, t);
        }
    }, [translationLanguages, setLanguagesSocialChatFromAPI]);
    useEffect(() => {
        recalc();
    }, []);
    useEffect(() => {
        recalc();
    }, [displayMessages.length]);
    useEffect(() => {
        recalc();
    }, [inputBarHeight, keyboardHeight]);
    useEffect(() => {
        if (!showScrollButton) {
            const b = messagesEndRef.current;
            if (b) b.scrollIntoView({ behavior: "smooth", block: "end" });
            requestAnimationFrame(() => recalc());
        }
    }, [displayMessages.length, showScrollButton, recalc, messagesEndRef]);

    useAppState(() => {
        if (roomId) queryClient.invalidateQueries(["messages", roomId]);
    });
    const handleReplyMessage = useCallback((message: ChatMessage) => {
        setReplyingToMessage(message);
    }, [setReplyingToMessage]);

    const handleCancelReply = useCallback(() => {
        clearReplyingToMessage();
    }, [clearReplyingToMessage]);
    const lastScrollPosRef = useRef<number | null>(null);

    useEffect(() => {
        if (keyboardHeight > 0) {
            if (messagesContainerRef.current) {
                lastScrollPosRef.current = messagesContainerRef.current.scrollTop;
            }
            setTimeout(() => {
                if (messagesContainerRef.current) {
                    messagesContainerRef.current.scrollTo({
                        top: messagesContainerRef.current.scrollTop + keyboardHeight,
                        behavior: "smooth"
                    });
                }
            }, 50);

        } else {
            if (lastScrollPosRef.current !== null && messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = lastScrollPosRef.current;
                lastScrollPosRef.current = null;
            }
        }
    }, [keyboardHeight]);
    return (
        <MotionStyles
            isOpen={translateSheet.isOpen || sheetExpand.isOpen}
            translateY={translateSheet.translateY || sheetExpand.translateY}
            screenHeight={window.innerHeight}
        >
            {({ scale, opacity, borderRadius, backgroundColor }) => (
                <div
                    className={` ${translateSheet.isOpen || sheetExpand.isOpen ? "" : "bg-blue-100"}`}
                    style={{
                        backgroundColor: backgroundColor,
                        transition: translateSheet.isOpen || sheetExpand.isOpen ? "none" : "background-color 0.3s ease",
                        // paddingTop: "var(--safe-area-inset-top)",
                    }}
                >
                    <MotionBottomSheet
                        isOpen={translateSheet.isOpen || sheetExpand.isOpen}
                        scale={scale}
                        opacity={opacity}
                        borderRadius={borderRadius}
                    >
                        <div
                            className="relative flex flex-col bg-white"
                            style={{
                                paddingRight: 0,
                                paddingLeft: 0,
                                // paddingBottom: keyboardHeight > 0 ? (keyboardResizeScreen ? 90 : 60) : (isNative ? 0 : 60),
                                height: "100svh",
                            }}
                        >
                            <SocialChatHeader
                                onBackClick={() => history.push("/social-chat")}
                                roomChatInfo={roomChatInfo}
                                roomData={roomData}
                                onSendFriendRequest={sendRequest.mutate}
                                onCancelFriendRequest={cancelRequest.mutate}
                                currentUserId={userInfo?.id || 0}
                                onUnfriend={() => {
                                    if (!peerUserId) return;
                                    unfriendMutation.mutate({ friendUserId: peerUserId, roomCode: roomId ?? undefined });
                                }}
                                roomId={roomId}
                            />
                            <div
                                className={`flex-1 overflow-x-hidden overflow-y-auto px-4 min-h-0`}
                                // style={
                                //     !isNative
                                //         ? {
                                //             position: "relative",
                                //             height: `calc(100vh - ${inputBarHeight - 40}px)`,
                                //             paddingBottom: keyboardHeight > 0 ? keyboardHeight : 0
                                //         }
                                //         : undefined
                                // }
                                ref={messagesContainerRef}
                                onScroll={handleScrollWithLoadMore}
                            >
                                {roomChatInfo?.type === ChatInfoType.UserVsUser &&
                                    // !hasNextPage && !isFetchingNextPage && !isLoadingMessages && 
                                    userInfo &&
                                    (
                                        <ChatRelationshipBanner
                                            roomData={roomData}
                                            onAcceptFriend={acceptRequest.mutate}
                                            onRejectFriend={rejectRequest.mutate}
                                            currentUserId={userInfo.id}
                                            userInfo={userInfo}
                                        />
                                    )}
                                {isFetchingNextPage && (
                                    <div className="flex justify-center py-2">
                                        <div className="text-sm text-gray-500">{t("Loading more messages...")}</div>
                                    </div>
                                )}
                                {isLoadingMessages ? (
                                    <div className="flex justify-center py-4">
                                        <div className="text-sm text-gray-500">{t("Loading messages...")}</div>
                                    </div>
                                ) : (
                                    <ChatMessageList
                                        allMessages={displayMessages}
                                        onEditMessage={handleEditMessage}
                                        onRevokeMessage={handleRevokeMessage}
                                        onReplyMessage={handleReplyMessage}
                                        isGroup={roomChatInfo?.type !== ChatInfoType.UserVsUser}
                                        currentUserId={userInfo?.id}
                                        hasReachedLimit={hasReachedLimit}
                                        isSendingMessage={isSendingMessage}
                                        activeUserIds={roomChatInfo?.activeUserIds || []}
                                        roomData={roomData}
                                    />
                                )}
                                {typingUsers && typingUsers.length > 0 && (
                                    <TypingIndicatorWrapper
                                        typingUsers={typingUsers}
                                        onHeightChange={setTypingIndicatorHeight}
                                    />
                                )}
                                {hasReachedLimit && (
                                    <MessageLimitNotice
                                        roomData={roomData}
                                        roomChatInfo={roomChatInfo}
                                        userInfo={userInfo}
                                        isFriend={roomData?.isFriend}
                                    // onSendFriend={awaitingAccept ? undefined : handleSendFriend}
                                    />
                                )}
                                {keyboardResizeScreen && (
                                    <div
                                        className="lg:h-0 xl:h-20"
                                        style={{ height: `${inputBarHeight}px` }}
                                    />
                                )}
                                <div ref={messagesEndRef} className="h-px mt-auto shrink-0" />
                            </div>
                            <div className={`bg-white w-full z-51 pb-2 ${keyboardResizeScreen ? "fixed" : !isNative && ""
                                } ${isNative ? "bottom-0" : "bottom-0"} ${keyboardResizeScreen && !isNative ? "!bottom-0" : ""
                                } `}>
                                <div className="relative">
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
                                    <ChatInputBar
                                        messageValue={messageValue}
                                        setMessageValue={setMessageValue}
                                        messageRef={messageRef}
                                        handleSendMessage={handleSendMessageWithPending}
                                        handleImageChange={handleImageChange}
                                        onTakePhoto={handleTakePhoto}
                                        onOpenGallery={handleOpenGallery}
                                        onCameraResult={handleCameraResult}
                                        roomId={roomId}
                                        uploadImageMutation={uploadImageMutation}
                                        addPendingImages={addPendingImages}
                                        pendingFiles={chatPendingFiles}
                                        onRemovePendingFile={removePendingFile}
                                        onRetryUpload={handleRetryUpload}
                                        isNative={isNative}
                                        isDesktop={isDesktop}
                                        messageTranslateRef={messageTranslateRef}
                                        messageTranslate={messageTranslate}
                                        setMessageTranslate={setMessageTranslate}
                                        openModalTranslate={translateSheet.open}
                                        languagesSocialChat={languagesSocialChat}
                                        selectedLanguageSocialChat={selectedLanguageSocialChat}
                                        setSelectedLanguageSocialChat={setSelectedLanguageSocialChat}
                                        replyingToMessage={replyingToMessage}
                                        onCancelReply={handleCancelReply}
                                        hasReachedLimit={hasReachedLimit}
                                        openInputExpandSheet={openInputExpandSheet}
                                        openTranslateExpandSheet={openTranslateExpandSheet}
                                        onTranslate={handleTranslate}
                                        setInputBarHeight={setInputBarHeight}
                                        translateActionStatus={translateActionStatus}
                                        isTranslating={isTranslating}
                                        actionFieldSend={actionFieldSend}
                                        setTranslateActionStatus={setTranslateActionStatus}
                                        typing={typing}
                                    />
                                </div>
                            </div>

                            {/* <NativeGalleryPicker
                                multiSelect         
                                showActionBar      
                                submitLabel="Gửi"
                                maxHeight={360}
                                onSubmit={handleSubmit}
                            /> */}
                        </div>
                    </MotionBottomSheet>

                    <LanguageSelectModal
                        isOpen={translateSheet.isOpen}
                        translateY={translateSheet.translateY}
                        handleTouchStart={translateSheet.handleTouchStart}
                        handleTouchMove={translateSheet.handleTouchMove}
                        handleTouchEnd={translateSheet.handleTouchEnd}
                        closeModal={translateSheet.close}
                        inputValue={inputValueTranslate}
                        setInputValue={setInputValueTranslate}
                        languagesSocialChat={languagesSocialChat}
                        onSelect={onSelectSocialChat}
                        handleInputSearch={(e) => setInputValueTranslate(e.target.value)}
                    />
                    <ExpandInputModal
                        isOpen={sheetExpand.isOpen}
                        translateY={sheetExpand.translateY}
                        closeModal={closeSheet}
                        handleTouchStart={sheetExpand.handleTouchStart}
                        handleTouchMove={sheetExpand.handleTouchMove}
                        handleTouchEnd={sheetExpand.handleTouchEnd}
                        title={expandTitle}
                        value={expandValue}
                        onChange={setExpandValue}
                        placeholder={expandPlaceholder}
                        handleSendMessage={handleSendMessageWithPending}
                        actionFieldSend={actionFieldSend}
                        translateActionStatus={translateActionStatus}
                        sheetExpandMode={sheetExpandMode}
                    />
                </div>
            )}
        </MotionStyles>
    );
};

export default SocialChatThread;