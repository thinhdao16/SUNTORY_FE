import React, { useEffect, useMemo, useRef, useCallback } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useChatStreamMessages } from "./hooks/useChatStreamMessages";
import { useKeyboardResize } from "@/hooks/useKeyboardResize";
import { useScrollButton } from "@/hooks/useScrollButton";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import { useUploadChatFile } from "@/hooks/common/useUploadChatFile";
import { useAppState } from "@/hooks/useAppState";
import { useChatRoomByCode, useUpdateSocialChatMessage, useRevokeSocialChatMessage } from "../hooks/useSocialChat";
import { useSocialChatMessages } from "../hooks/useSocialChat";
import { useSocialChatStore } from "@/store/zustand/social-chat-store";

import ChatInputBar from "./components/ChatInputBar";
import PendingFiles from "./components/PendingFiles";
import PendingImages from "./components/PendingImages";
import SocialChatHeader from "./components/SocialChatHeader";
import ChatRelationshipBanner from "./components/ChatRelationshipBanner";
import MotionStyles from "@/components/common/bottomSheet/MotionStyles";
import MotionBottomSheet from "@/components/common/bottomSheet/MotionBottomSheet";
import LanguageSelectModal from "@/components/common/bottomSheet/LanguageInutModal";

import { IoArrowDown } from "react-icons/io5";
import { useSocialChatThread } from "./hooks/useSocialChatThread";
import { useSocialChatModals } from "./useSocialChatTranslateModals";
import { ChatInfoType } from "@/constants/socialChat";
import { useAcceptFriendRequest, useCancelFriendRequest, useRejectFriendRequest, useSendFriendRequest } from "@/pages/SocialPartner/hooks/useSocialPartner";
import { mergeSocialChatMessages } from "@/utils/mapSocialChatMessage";
import { ChatMessageList } from "./components/ChatMessageList";
import { useSocialChatHandlers } from "./hooks/useSocialChatHandlers";
import { useSocialSignalR } from "@/hooks/useSocialSignalR";
import { ChatMessage } from "@/types/social-chat";

dayjs.extend(utc);

const SocialChatThread: React.FC = () => {
    const {
        type, roomId, history, queryClient,
        isNative, isDesktop,
        messageTranslate, setMessageTranslate,
        isOpenTranslateInput, setIsOpenTranslateInput,
        translateY, setTranslateY,
        inputValueTranslate, setInputValueTranslate,
        screenHeight, messagesEndRef, messagesContainerRef,
        pendingBarRef, messageRef, messageTranslateRef,
        translationLanguages, roomChatInfo, imageLoading,
        languagesSocialChat, onSelectSocialChat, setLanguagesSocialChatFromAPI,
        setSelectedLanguageSocialChat, selectedLanguageSocialChat,
        pendingImages, pendingFiles, addPendingImages, addPendingFiles,
        removePendingImage, removePendingFile, removePendingImageByUrl, showToast,
        userInfo, messages, addMessage, updateMessageByCode, updateMessageByTempId, updateMessageWithServerResponse, deviceInfo, setMessages, setLoadingMessages, addMessages,
        justSentMessageRef, replyingToMessage, setReplyingToMessage, clearReplyingToMessage,
        initialLoadRef, prevMessagesLength
    } = useSocialChatThread();
    const {
        openModalTranslate, closeModalTranslate,
        handleTouchStart, handleTouchMove, handleTouchEnd
    } = useSocialChatModals(
        screenHeight,
        { current: null },
        { current: null },
        setIsOpenTranslateInput,
        setTranslateY,
        translateY
    );
    useSocialSignalR(deviceInfo.deviceId ?? "", { roomId: roomId ?? "" })
    const { scrollToBottom, messageValue, setMessageValue } = useChatStreamMessages(
        messageRef, messagesEndRef, messagesContainerRef, roomId, false, true
    );
    const updateMessageMutation = useUpdateSocialChatMessage();
    const revokeMessageMutation = useRevokeSocialChatMessage();
    const uploadImageMutation = useUploadChatFile();
    const scrollToBottomMess = useScrollToBottom(messagesEndRef, 0, "auto");
    const { keyboardHeight, keyboardResizeScreen } = useKeyboardResize();
    const { showScrollButton, handleScroll } = useScrollButton(messagesContainerRef);
    const { data: roomData, refetch: refetchRoomData } = useChatRoomByCode(roomId ?? "");
    const sendRequest = useSendFriendRequest(showToast, refetchRoomData);
    const cancelRequest = useCancelFriendRequest(showToast, refetchRoomData);
    const acceptRequest = useAcceptFriendRequest(showToast, refetchRoomData);
    const rejectRequest = useRejectFriendRequest(showToast, refetchRoomData);
    useAutoResizeTextarea(messageRef, messageValue);
    const {
        data: messagesData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingMessages,
        refetch: refetchMessages,
    } = useSocialChatMessages(roomId || "", 20);

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
    const {
        handleScrollWithLoadMore,
        handleSendMessage,
        handleImageChange,
        handleFileChange,
        handleEditMessage,
        handleRevokeMessage,
        handleTakePhoto
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
        handleScroll,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage: async () => { await fetchNextPage(); },
        updateMessageByCode,
        displayMessages,
        updateMessageMutation,
        revokeMessageMutation,
        replyingToMessage,
        history
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
    }, [messagesData, addMessages]);
    useEffect(() => {
        const isInitial = initialLoadRef.current;
        const isFirstLoad = isInitial && displayMessages.length > 0;
        const hasNewMessage = displayMessages.length > prevMessagesLength.current;

        if (isFirstLoad) {
            scrollToBottomMess();
            setTimeout(() => {
                scrollToBottomMess();
            }, 300);
            setTimeout(() => {
                scrollToBottomMess();
            }, 800);

            initialLoadRef.current = false;
        } else if (!isInitial && hasNewMessage) {
            if (justSentMessageRef.current) {
                scrollToBottomMess();
                justSentMessageRef.current = false;
            }
        }

        prevMessagesLength.current = displayMessages.length;
    }, [displayMessages, scrollToBottomMess]);  


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
            // const autoLang = translationLanguages.find(lang =>
            //     lang.code === "auto" || lang.name.toLowerCase() === "auto"
            // );
            // if (autoLang) {
            //     setSelectedLanguageSocialChat({
            //         id: autoLang.id,
            //         code: autoLang.code,
            //         label: autoLang.name,
            //         selected: true,
            //         lang: autoLang.name
            //     });
            // }
        }
    }, [translationLanguages, setLanguagesSocialChatFromAPI]);
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
            isOpen={isOpenTranslateInput}
            translateY={translateY}
            screenHeight={screenHeight.current}
        >
            {({ scale, opacity, borderRadius, backgroundColor }) => (
                <div
                    className="bg-white"
                    style={{
                        backgroundColor,
                        transition: isOpenTranslateInput ? "none" : "background-color 0.3s ease",
                        // paddingTop: "var(--safe-area-inset-top)",
                    }}
                >
                    <MotionBottomSheet
                        isOpen={isOpenTranslateInput}
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
                            />
                            {/* {roomChatInfo?.type === ChatInfoType.UserVsUser && (
                                <ChatRelationshipBanner
                                    roomData={roomData}
                                    onAcceptFriend={acceptRequest.mutate}
                                    onRejectFriend={rejectRequest.mutate}
                                    onSendFriendRequest={sendRequest.mutate}
                                    onCancelFriendRequest={cancelRequest.mutate}
                                    currentUserId={userInfo?.id || 0}
                                />
                            )} */}
                            <div
                                className={`flex-1 overflow-x-hidden overflow-y-auto p-6 ${!isNative && !keyboardResizeScreen
                                    ? "pb-2 max-h-[calc(100dvh-148px)]"
                                    : ""
                                    }`}
                                ref={messagesContainerRef}
                                onScroll={handleScrollWithLoadMore}
                            >
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
                                    />
                                )}
                                <div ref={messagesEndRef} className="mt-4" />
                            </div>
                            <div className={`bg-white w-full ${keyboardResizeScreen ? "fixed" : !isNative && "fixed"
                                } ${isNative ? "bottom-0" : "bottom-0"} ${keyboardResizeScreen && !isNative ? "!bottom-0" : ""
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
                                    openModalTranslate={openModalTranslate}
                                    languagesSocialChat={languagesSocialChat}
                                    selectedLanguageSocialChat={selectedLanguageSocialChat}
                                    setSelectedLanguageSocialChat={setSelectedLanguageSocialChat}
                                    replyingToMessage={replyingToMessage}
                                    onCancelReply={handleCancelReply}
                                />
                            </div>
                        </div>
                    </MotionBottomSheet>

                    <LanguageSelectModal
                        isOpen={isOpenTranslateInput}
                        translateY={translateY}
                        handleTouchStart={handleTouchStart}
                        handleTouchMove={handleTouchMove}
                        handleTouchEnd={handleTouchEnd}
                        closeModal={closeModalTranslate}
                        inputValue={inputValueTranslate}
                        setInputValue={setInputValueTranslate}
                        languagesSocialChat={languagesSocialChat}
                        onSelect={onSelectSocialChat}
                        handleInputSearch={(e) => setInputValueTranslate(e.target.value)}
                    />
                </div>
            )}
        </MotionStyles>
    );
};

export default SocialChatThread;