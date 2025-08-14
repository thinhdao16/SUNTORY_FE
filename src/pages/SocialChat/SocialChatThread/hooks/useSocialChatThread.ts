import { useState, useRef, useEffect } from "react";
import { useHistory, useParams } from "react-router-dom";
import { useQueryClient } from "react-query";
import { Capacitor } from "@capacitor/core";
import useNetworkStatus from "@/hooks/useNetworkStatus";
import { useCreateTranslationChat, useTranslationLanguages } from "@/pages/Translate/hooks/useTranslationLanguages";
import useLanguageStore from "@/store/zustand/language-store";
import { useSocialChatStore } from "@/store/zustand/social-chat-store";
import { useImageStore } from "@/store/zustand/image-store";
import { useUploadStore } from "@/store/zustand/upload-store";
import { useToastStore } from "@/store/zustand/toast-store";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { ChatMessage } from "@/types/social-chat";
import { useBottomSheet } from "@/hooks/useBottomSheet";
import { useSocialSignalR } from "@/hooks/useSocialSignalR";
import { useChatStreamMessages } from "./useChatStreamMessages";
import { useChatRoomByCode } from "../../hooks/useSocialChat";
import { useAcceptFriendRequest, useCancelFriendRequest, useRejectFriendRequest, useSendFriendRequest, useUnfriend } from "@/pages/SocialPartner/hooks/useSocialPartner";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";
import { send } from "ionicons/icons";

export type SheetExpandMode = "input" | "translate" | null;

export const useSocialChatThread = () => {
    const { type, roomId } = useParams<{ roomId?: string; type?: string }>();
    const history = useHistory();
    const queryClient = useQueryClient();

    const isNative = Capacitor.isNativePlatform();
    const isOnline = useNetworkStatus();
    const isDesktop = typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
    const deviceInfo: { deviceId: string | null, language: string | null } = useDeviceInfo();
    const sheetExpand = useBottomSheet();

    // States
    const [sheetExpandMode, setSheetExpandMode] = useState<SheetExpandMode>(null);
    const [messageTranslate, setMessageTranslate] = useState<string>('');
    const [inputValueTranslate, setInputValueTranslate] = useState("");
    const [inputBarHeight, setInputBarHeight] = useState(148);
    const [translateActionStatus, setTranslateActionStatus] = useState<boolean>(false);

    // Refs
    const screenHeight = useRef(window.innerHeight);
    const messageRef = useRef<any>(null);
    const messageTranslateRef = useRef<any>(null);
    const messagesEndRef = useRef<any>(null);
    const messagesContainerRef = useRef<any>(null);
    const pendingBarRef = useRef<HTMLDivElement>(null);
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

    const { scrollToBottom, messageValue, setMessageValue } = useChatStreamMessages(
        messageRef, messagesEndRef, messagesContainerRef, roomId, false, true
    );
    const imageLoading = useUploadStore.getState().imageLoading;
    const showToast = useToastStore((state) => state.showToast);
    const { data: userInfo } = useAuthInfo();
    const { data: roomData, refetch: refetchRoomData } = useChatRoomByCode(roomId ?? "");
    const createTranslationMutation = useCreateTranslationChat();
    const unfriendMutation = useUnfriend(showToast, refetchRoomData);
    const sendRequest = useSendFriendRequest(showToast, refetchRoomData);
    const cancelRequest = useCancelFriendRequest(showToast, refetchRoomData);
    const acceptRequest = useAcceptFriendRequest(showToast, refetchRoomData);
    const rejectRequest = useRejectFriendRequest(showToast, refetchRoomData);
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
    useAutoResizeTextarea(messageRef, messageValue);

    const translateSheet = useBottomSheet();
    const openInputExpandSheet = () => { setSheetExpandMode("input"); sheetExpand.open(); };
    const openTranslateExpandSheet = () => { setSheetExpandMode("translate"); sheetExpand.open(); };
    const closeSheet = () => { sheetExpand.close(); setTimeout(() => setSheetExpandMode(null), 300); };
    const isTranslating = !!createTranslationMutation?.isLoading;
    const {
        pingActiveRoom,
        setInactiveInRoom,
        typing
    } = useSocialSignalR(deviceInfo.deviceId ?? "", {
        roomId: roomId ?? "",
        refetchRoomData,
        autoConnect: true,
        enableDebugLogs: false,
    });
    const usePeerUserId = (roomData?: any, myId?: number) => {
        const participants = roomData?.participants ?? [];
        const other = participants.find((p: any) => {
            const pid = p?.user?.id ?? p?.userId;
            return pid != null && pid !== myId;
        });
        return other?.user?.id ?? other?.userId ?? null;
    };
    const actionFieldSend = useMemo(() => {
        if (translateActionStatus) {
            return isTranslating ? "input" : "inputTranslate";
        }
        return "input";
    }, [translateActionStatus, isTranslating]);
    useEffect(() => {
        if (roomId) {
            setActiveRoomId(roomId);
        }
        return () => {
            setActiveRoomId(null);
        };
    }, [roomId, setActiveRoomId]);
    useEffect(() => {
        if (!roomId) return;

        pingActiveRoom(roomId);
        const interval = setInterval(() => {
            pingActiveRoom(roomId);
        }, 30000);

        return () => {
            clearInterval(interval);
            setInactiveInRoom(roomId);
        };
    }, [roomId, pingActiveRoom, setInactiveInRoom]);

    const messages = roomId ? getMessagesForRoom(roomId) : [];
    const isLoadingMessages = roomId ? getLoadingForRoom(roomId) : false;

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

    const expandValue = sheetExpandMode === "translate" ? messageTranslate : messageValue;
    const setExpandValue = sheetExpandMode === "translate" ? setMessageTranslate : setMessageValue;
    const expandTitle = sheetExpandMode === "translate" ? t("Expand Translation") : t("Your Full Message");
    const expandPlaceholder = sheetExpandMode === "translate" ? t("Translate here...") : t("Type your message...");
    return {
        // Params & routing
        type, roomId, history, queryClient,

        // Device info
        isNative, isOnline, isDesktop,

        // States
        messageTranslate, setMessageTranslate,
        translateActionStatus, setTranslateActionStatus,
        inputValueTranslate, setInputValueTranslate,
        inputBarHeight, setInputBarHeight,
        // Refs
        screenHeight, messageRef, messageTranslateRef,
        messagesEndRef, messagesContainerRef, pendingBarRef,

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
        scrollToBottom, messageValue, setMessageValue,
        expandValue, setExpandValue, expandTitle, expandPlaceholder,
        typing,
        // Additional functions
        updateMessageByCode: updateMessageByCodeForCurrentRoom,
        removeMessage: removeMessageFromCurrentRoom,
        clearMessages: clearMessagesForCurrentRoom,

        // Store state gốc (nếu cần truy cập trực tiếp)
        messagesByRoomId,
        activeRoomId,
        translateSheet,
        sheetExpand,
        openInputExpandSheet,
        openTranslateExpandSheet,
        closeSheet,
        setSheetExpandMode, sheetExpandMode,
        usePeerUserId,
        roomData, refetchRoomData, createTranslationMutation,
        unfriendMutation, sendRequest, cancelRequest, acceptRequest, rejectRequest, actionFieldSend, isTranslating,
    };
};