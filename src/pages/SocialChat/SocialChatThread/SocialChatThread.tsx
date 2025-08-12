import React, { useEffect, useMemo, useCallback } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useKeyboardResize } from "@/hooks/useKeyboardResize";
import { useScrollButton } from "@/hooks/useScrollButton";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import { useUploadChatFile } from "@/hooks/common/useUploadChatFile";
import { useAppState } from "@/hooks/useAppState";
import { useChatRoomByCode, useUpdateSocialChatMessage, useRevokeSocialChatMessage } from "../hooks/useSocialChat";
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
import { useAcceptFriendRequest, useCancelFriendRequest, useRejectFriendRequest, useSendFriendRequest } from "@/pages/SocialPartner/hooks/useSocialPartner";
import { mergeSocialChatMessages } from "@/utils/mapSocialChatMessage";
import { ChatMessageList } from "./components/ChatMessageList";
import { useSocialChatHandlers } from "./hooks/useSocialChatHandlers";
import { ChatMessage } from "@/types/social-chat";
import MessageLimitNotice from "./components/MessageLimitNotice";
import ExpandInputModal from "@/components/common/bottomSheet/ExpandInputModal";
import { useCreateTranslation } from "@/pages/Translate/hooks/useTranslationLanguages";

dayjs.extend(utc);

const SocialChatThread: React.FC = () => {
    const {
        type, roomId, history, queryClient,
        isNative, isDesktop,
        messageTranslate, setMessageTranslate,
        inputValueTranslate, setInputValueTranslate,
        inputBarHeight, setInputBarHeight,
        messagesEndRef, messagesContainerRef,
        messageRef, messageTranslateRef,
        translationLanguages, roomChatInfo,
        languagesSocialChat, onSelectSocialChat, setLanguagesSocialChatFromAPI,
        setSelectedLanguageSocialChat, selectedLanguageSocialChat,
        pendingImages, pendingFiles, addPendingImages, addPendingFiles,
        removePendingImageByUrl, showToast,
        userInfo, messages, addMessage, updateMessageByCode, updateMessageByTempId, updateMessageWithServerResponse, deviceInfo, setLoadingMessages, addMessages,
        replyingToMessage, setReplyingToMessage, clearReplyingToMessage,
        initialLoadRef, prevMessagesLength,
        translateSheet, sheetExpand, openInputExpandSheet, openTranslateExpandSheet, closeSheet, sheetExpandMode, screenHeight, messageValue, setMessageValue,
        expandValue, setExpandValue, expandTitle, expandPlaceholder,
    } = useSocialChatThread();

    const updateMessageMutation = useUpdateSocialChatMessage();
    const revokeMessageMutation = useRevokeSocialChatMessage();
    const uploadImageMutation = useUploadChatFile();
    const scrollToBottomMess = useScrollToBottom(messagesEndRef, 0, "auto");
    const { keyboardHeight, keyboardResizeScreen } = useKeyboardResize();
    const { showScrollButton, onContainerScroll, setShowScrollButton, recalc } = useScrollButton(messagesContainerRef, messagesEndRef);
    const { data: roomData, refetch: refetchRoomData } = useChatRoomByCode(roomId ?? "");
    const sendRequest = useSendFriendRequest(showToast, refetchRoomData);
    const cancelRequest = useCancelFriendRequest(showToast, refetchRoomData);
    const acceptRequest = useAcceptFriendRequest(showToast, refetchRoomData);
    const rejectRequest = useRejectFriendRequest(showToast, refetchRoomData);
    const createTranslationMutation = useCreateTranslation();
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ block: "end" });
        setTimeout(recalc, 0);
    }, [recalc]);
    useAutoResizeTextarea(messageRef, messageValue);
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
    }, [serverMessages, messages]);

    const userRightCount = useMemo(
        () => displayMessages.reduce((acc, m) => acc + (m?.isRight ? 1 : 0), 0),
        [displayMessages]
    );
    const hasReachedLimit = !roomData?.isFriend && userRightCount >= CountLimitChatDontFriend && roomChatInfo?.type === ChatInfoType.UserVsUser;
    const {
        handleScrollWithLoadMore,
        handleSendMessage,
        handleImageChange,
        handleEditMessage,
        handleRevokeMessage,
        handleTakePhoto,
        handleTranslate,
    } = useSocialChatHandlers({
        addPendingImages,
        addPendingFiles,
        pendingImages,
        pendingFiles,
        messageValue,
        setMessageValue,
        uploadImageMutation,
        removePendingImageByUrl,
        scrollToBottom,
        addMessage,
        updateMessageByTempId,
        updateMessageWithServerResponse,
        roomId: roomId ?? "",
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
    });
    const handleScroll = useCallback(() => {
        onContainerScroll?.(); 
        recalc();              
    }, [onContainerScroll, recalc]);
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
    }, [messagesData, addMessages]);
    useEffect(() => {
        const isInitial = initialLoadRef.current;
        const isFirstLoad = isInitial && displayMessages.length > 0;

        if (isFirstLoad) {
            setTimeout(() => {
                scrollToBottomMess();
                requestAnimationFrame(() => requestAnimationFrame(() => recalc()));
            }, 100);
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
    useAppState(() => {
        if (roomId) queryClient.invalidateQueries(["messages", roomId]);
    });
    const handleReplyMessage = useCallback((message: ChatMessage) => {
        setReplyingToMessage(message);
    }, [setReplyingToMessage]);

    const handleCancelReply = useCallback(() => {
        clearReplyingToMessage();
    }, [clearReplyingToMessage]);
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
                                paddingBottom: keyboardHeight > 0 ? (keyboardResizeScreen ? 60 : keyboardHeight) : 0,
                                height: "100dvh",
                            }}
                        >
                            <SocialChatHeader
                                onBackClick={() => history.push("/social-chat")}
                                roomChatInfo={roomChatInfo}
                                roomData={roomData}
                                onSendFriendRequest={sendRequest.mutate}
                                onCancelFriendRequest={cancelRequest.mutate}
                                currentUserId={userInfo?.id || 0}
                                onUnfriend={() => { }}
                            />

                            <div
                                className={`flex-1 overflow-x-hidden overflow-y-auto p-6 ${!isNative && !keyboardResizeScreen ? "pb-2" : ""
                                    }`}
                                style={
                                    !isNative && !keyboardResizeScreen
                                        ? { maxHeight: `calc(100dvh - ${inputBarHeight}px)` }
                                        : undefined
                                }
                                ref={messagesContainerRef}
                                onScroll={handleScroll}
                            >
                                {roomChatInfo?.type === ChatInfoType.UserVsUser && !hasNextPage && !isFetchingNextPage && !isLoadingMessages && userInfo && (
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
                                        <div className="text-sm text-gray-500">Đang tải thêm tin nhắn...</div>
                                    </div>
                                )}
                                {isLoadingMessages ? (
                                    <div className="flex justify-center py-4">
                                        <div className="text-sm text-gray-500">Đang tải tin nhắn...</div>
                                    </div>
                                ) : (
                                    <ChatMessageList
                                        allMessages={displayMessages}
                                        onEditMessage={handleEditMessage}
                                        onRevokeMessage={handleRevokeMessage}
                                        onReplyMessage={handleReplyMessage}
                                        isGroup={roomChatInfo?.type !== ChatInfoType.UserVsUser}
                                        currentUserId={userInfo?.id}
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
                                <div ref={messagesEndRef} style={{ height: 1 }} />
                            </div>
                            <div className={`bg-white w-full z-2 ${keyboardResizeScreen ? "fixed" : !isNative && "fixed"
                                } ${isNative ? "bottom-0" : "bottom-0"} ${keyboardResizeScreen && !isNative ? "!bottom-0" : ""
                                } ${keyboardResizeScreen && isNative ? "pb-4" : "pb-4"}`}>

                                {/* 
                                <div className="">
                                    <div ref={pendingBarRef} className="flex gap-2 flex-wrap">
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
                                </div> */}

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
                                        handleSendMessage={handleSendMessage}
                                        handleImageChange={handleImageChange}
                                        onTakePhoto={handleTakePhoto}
                                        uploadImageMutation={uploadImageMutation}
                                        addPendingImages={addPendingImages}
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
                                    />
                                </div>
                            </div>
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
                    />
                </div>
            )}
        </MotionStyles>
    );
};

export default SocialChatThread;