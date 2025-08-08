import { useState, useRef, useEffect } from "react";
import { useHistory, useParams } from "react-router-dom";
import { useQueryClient } from "react-query";
import { Capacitor } from "@capacitor/core";
import useNetworkStatus from "@/hooks/useNetworkStatus";
import { useTranslationLanguages } from "@/pages/Translate/hooks/useTranslationLanguages";
import useLanguageStore from "@/store/zustand/language-store";
import { useSocialChatStore } from "@/store/zustand/social-chat-store";
import { useImageStore } from "@/store/zustand/image-store";
import { useUploadStore } from "@/store/zustand/upload-store";
import { useToastStore } from "@/store/zustand/toast-store";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { ChatMessage } from "@/types/social-chat";

export const useSocialChatThread = () => {
    const { type, roomId } = useParams<{ roomId?: string; type?: string }>();
    const history = useHistory();
    const queryClient = useQueryClient();

    const isNative = Capacitor.isNativePlatform();
    const isOnline = useNetworkStatus();
    const isDesktop = typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
    const deviceInfo: { deviceId: string | null, language: string | null } = useDeviceInfo();

    // States
    const [messageTranslate, setMessageTranslate] = useState<string>('');
    const [isOpenTranslateInput, setIsOpenTranslateInput] = useState(false);
    const [translateY, setTranslateY] = useState(0);
    const [inputValueTranslate, setInputValueTranslate] = useState("");

    // Refs
    const screenHeight = useRef(window.innerHeight);
    const startY = useRef<number | null>(null);
    const messageRef = useRef<any>(null);
    const messageTranslateRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const pendingBarRef = useRef<HTMLDivElement>(null);
    const startTime = useRef<number | null>(null);
    const prevMessagesLength = useRef(0);
    const initialLoadRef = useRef(true);
    const justSentMessageRef = useRef(false);

    const { data: translationLanguages } = useTranslationLanguages();
    const {
        roomChatInfo,
        messagesByRoomId,
        activeRoomId,
        setActiveRoomId,
        getMessagesForRoom,
        getLoadingForRoom,
        setMessages: setMessagesStore,
        addMessage: addMessageStore,
        addMessages: addMessagesStore,
        updateMessage: updateMessageStore,
        updateMessageByTempId: updateMessageByTempIdStore,
        updateMessageWithServerResponse: updateMessageWithServerResponseStore,
        updateMessageByCode,
        setLoadingMessages: setLoadingMessagesStore,
        removeMessage,
        clearMessages,
        replyingToMessageByRoomId: replyingToMessageStore,
        setReplyingToMessage: setReplyingToMessageStore,
        clearReplyingToMessage: clearReplyingToMessageStore
    } = useSocialChatStore();

    const imageLoading = useUploadStore.getState().imageLoading;
    const showToast = useToastStore((state) => state.showToast);
    const { data: userInfo } = useAuthInfo();
    const {
        languagesSocialChat,
        onSelectSocialChat,
        setLanguagesSocialChatFromAPI,
        setSelectedLanguageSocialChat,
        selectedLanguageSocialChat
    } = useLanguageStore();

    const {
        pendingImages, pendingFiles,
        addPendingImages, addPendingFiles,
        removePendingImage, removePendingFile,
        removePendingImageByUrl
    } = useImageStore();

    // Set active room khi vào component
    useEffect(() => {
        if (roomId) {
            setActiveRoomId(roomId);
        }
        return () => {
            // Cleanup khi rời khỏi component
            setActiveRoomId(null);
        };
    }, [roomId, setActiveRoomId]);

    // Lấy messages và loading state cho room hiện tại
    const messages = roomId ? getMessagesForRoom(roomId) : [];
    const isLoadingMessages = roomId ? getLoadingForRoom(roomId) : false;

    // Wrapper functions để tự động truyền roomId
    const setMessages = (msgs: ChatMessage[]) => {
        if (roomId) {
            setMessagesStore(roomId, msgs);
        }
    };

    const addMessage = (msg: ChatMessage) => {
        if (roomId) {
            addMessageStore(roomId, msg);
        }
    };

    const addMessages = (msgs: ChatMessage[]) => {
        if (roomId) {
            addMessagesStore(roomId, msgs);
        }
    };

    const updateMessage = (msg: ChatMessage) => {
        if (roomId) {
            updateMessageStore(roomId, msg);
        }
    };

    const updateMessageByTempId = (msg: ChatMessage) => {
        if (roomId) {
            updateMessageByTempIdStore(roomId, msg);
        }
    };

    const updateMessageWithServerResponse = (tempId: string, serverData: Partial<ChatMessage>) => {
        if (roomId) {
            updateMessageWithServerResponseStore(roomId, tempId, serverData);
        }
    };

    const setLoadingMessages = (loading: boolean) => {
        if (roomId) {
            setLoadingMessagesStore(roomId, loading);
        }
    };

    const updateMessageByCodeForCurrentRoom = (messageCode: string, updatedData: Partial<ChatMessage>) => {
        if (roomId) {
            updateMessageByCode(roomId, messageCode, updatedData);
        }
    };

    const removeMessageFromCurrentRoom = (tempId: string) => {
        if (roomId) {
            removeMessage(roomId, tempId);
        }
    };

    const clearMessagesForCurrentRoom = () => {
        if (roomId) {
            clearMessages(roomId);
        }
    };
    const clearReplyingToMessage = () => {
        if (roomId) {
            clearReplyingToMessageStore(roomId);
        }
    };
    const setReplyingToMessage = (message: ChatMessage | null) => {
        if (roomId) {
            setReplyingToMessageStore(roomId, message);
        }
    };
    const replyingToMessage = roomId ? replyingToMessageStore[roomId] || null : null;

    return {
        // Params & routing
        type, roomId, history, queryClient,

        // Device info
        isNative, isOnline, isDesktop,

        // States
        messageTranslate, setMessageTranslate,
        isOpenTranslateInput, setIsOpenTranslateInput,
        translateY, setTranslateY,
        inputValueTranslate, setInputValueTranslate,

        // Refs
        screenHeight, startY, messageRef, messageTranslateRef,
        messagesEndRef, messagesContainerRef, pendingBarRef, startTime,

        // Store data
        translationLanguages, roomChatInfo, imageLoading,
        languagesSocialChat, onSelectSocialChat, setLanguagesSocialChatFromAPI,
        setSelectedLanguageSocialChat, selectedLanguageSocialChat,
        pendingImages, pendingFiles, addPendingImages, addPendingFiles,
        removePendingImage, removePendingFile, removePendingImageByUrl,
        userInfo, deviceInfo, showToast, justSentMessageRef,
        initialLoadRef, prevMessagesLength,

        // Messages cho room hiện tại
        messages,
        isLoadingMessages,

        // Wrapper functions với roomId tự động
        setMessages,
        addMessage,
        addMessages,
        updateMessage,
        updateMessageByTempId,
        updateMessageWithServerResponse,
        setLoadingMessages,
        setReplyingToMessage,
        clearReplyingToMessage,
        replyingToMessage,

        // Additional functions
        updateMessageByCode: updateMessageByCodeForCurrentRoom,
        removeMessage: removeMessageFromCurrentRoom,
        clearMessages: clearMessagesForCurrentRoom,

        // Store state gốc (nếu cần truy cập trực tiếp)
        messagesByRoomId,
        activeRoomId,
    };
};