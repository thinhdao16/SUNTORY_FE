import { UpdateSocialChatMessagePayload } from './../../../../services/social/social-chat-type';
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { uploadChatFile } from "@/services/file/file-service";
import React, { useCallback } from "react";
import { UseMutationResult } from "react-query";
import { useToastStore } from "@/store/zustand/toast-store";
import i18n from "@/config/i18n";
import { generatePreciseTimestampFromDate } from "@/utils/time-stamp";
import dayjs from "dayjs";
import { ChatMessage } from "@/types/social-chat";
import { useSendSocialChatMessage, useUpdateSocialChatMessage } from "../../hooks/useSocialChat";
import { CreateSocialChatMessagePayload } from "@/services/social/social-chat-type";
import { useAuthStore } from "@/store/zustand/auth-store";
import { Language } from '@/store/zustand/language-store';
interface UseSocialChatHandlersProps {
    addPendingImages: (images: string[]) => void;
    addPendingFiles: (files: { name: string; url: string }[]) => void;
    pendingImages: (string | File)[];
    pendingFiles: { name: string; url: string }[];
    messageValue: string;
    setMessageValue: (value: string) => void;
    uploadImageMutation: UseMutationResult<any, unknown, File | Blob>;
    removePendingImageByUrl: (url: string) => void;
    scrollToBottom: () => void;
    roomId: string;
    addMessage: (message: ChatMessage) => void;
    updateMessageByTempId: (message: ChatMessage) => void;
    updateMessageWithServerResponse: (tempId: string, serverData: Partial<ChatMessage>) => void;
    setLoadingMessages: (loading: boolean) => void;
    onContainerScroll: any;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    fetchNextPage: () => Promise<void>;
    updateMessageByCode: (messageCode: string, updatedData: Partial<ChatMessage>) => void;
    displayMessages: ChatMessage[];
    updateMessageMutation: UseMutationResult<ChatMessage, unknown, UpdateSocialChatMessagePayload>;
    revokeMessageMutation: UseMutationResult<any, unknown, { messageCode: string }>;
    replyingToMessage: ChatMessage | null;
    history: any;
    clearReplyingToMessage: () => void;
    hasReachedLimit?: boolean;
    selectedLanguageSocialChat?: Language | null;
    createTranslationMutation: any;
    setMessageTranslate: (text: string) => void;
    messageTranslate: string;
    showToast: (message: string, duration?: number, type?: "success" | "error" | "warning") => void;
    t: (key: string) => string;
    recalc: () => void;
}

export function useSocialChatHandlers({
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
    roomId,
    setLoadingMessages,
    onContainerScroll,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
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
    t,
    recalc
}: UseSocialChatHandlersProps) {
    const currentUserId = useAuthStore.getState().user?.id;
    const sendMessageMutation = useSendSocialChatMessage({ roomId });
    const MAX_IMAGE_SIZE = 15 * 1024 * 1024;

    const cleanImageUrl = (url: string): string => {
        if (!url) return url;

        const protocolDomainRegex = /(https?:\/\/[^\/]+)/g;
        const matches = url.match(protocolDomainRegex);

        if (matches && matches.length > 1) {
            const firstDomain = matches[0];
            const restOfUrl = url.split(matches[0]).slice(1).join('').replace(/^\/+/, '');
            let cleanedRest = restOfUrl;
            matches.slice(1).forEach(duplicateDomain => {
                cleanedRest = cleanedRest.replace(duplicateDomain + '/', '').replace(duplicateDomain, '');
            });

            return `${firstDomain}/${cleanedRest}`;
        }

        return url;
    };
    const sendPickedFiles = async (files: File[]) => {
        clearReplyingToMessage();
        const uploadedFiles: { name: string; linkImage: string }[] = [];
        const failedFiles: string[] = [];

        for (const file of files) {
            if (file.size > MAX_IMAGE_SIZE) {
                failedFiles.push(`${file.name} (>15MB)`);
                useToastStore.getState().showToast(`${file.name} quá lớn (>15MB)`, 3000, "warning");
                continue;
            }
            try {
                const uploaded = await uploadImageMutation.mutateAsync(file);
                if (uploaded?.length) {
                    const u = uploaded[0];
                    uploadedFiles.push({ name: u.name, linkImage: cleanImageUrl(u.linkImage) });
                }
            } catch (e) {
                failedFiles.push(`${file.name} (upload failed)`);
                useToastStore.getState().showToast(`Upload ${file.name} thất bại`, 3000, "error");
            }
        }

        if (uploadedFiles.length > 0) {
            const tempId = `temp_${Date.now()}_${Math.random()}`;
            const now = dayjs.utc();

            const finalMessage: ChatMessage = {
                id: Date.now(),
                tempId,
                messageText: "",
                messageType: 1,
                senderType: 1,
                userId: currentUserId ?? 0,
                userName: "currentUserName",
                userAvatar: "currentUserAvatar",
                createDate: now.format("YYYY-MM-DDTHH:mm:ss.SSS"),
                timeStamp: generatePreciseTimestampFromDate(now.toDate()),
                chatInfoId: 1,
                code: roomId || "",
                status: 10,
                attachments: [],
                isSend: false,
                isError: false,
                hasAttachment: 1,
                isRead: 0,
                isRevoked: 0,
                isEdited: 0,
                chatAttachments: uploadedFiles.map((f, i) => ({
                    id: Date.now() + i,
                    chatMessageId: 0,
                    fileUrl: f.linkImage,
                    fileName: f.name,
                    fileType: 1,
                    fileSize: 0,
                    createDate: now.format("YYYY-MM-DDTHH:mm:ss.SSS"),
                })),
                chatInfo: null,
                reactions: [],
                replyToMessageId: replyingToMessage?.id ?? null,
                replyToMessage: replyingToMessage ?? null,
                replyToMessageCode:
                    replyingToMessage?.code !== undefined && replyingToMessage?.code !== null
                        ? String(replyingToMessage.code)
                        : null,
            };

            addMessage(finalMessage);

            const payload: CreateSocialChatMessagePayload = {
                chatCode: roomId || null,
                messageText: "",
                files: uploadedFiles.map(f => ({ name: f.name })),
                replyToMessageCode:
                    replyingToMessage?.code !== undefined && replyingToMessage?.code !== null
                        ? String(replyingToMessage.code)
                        : null,
                tempId,
            };

            try {
                setLoadingMessages(true);
                const serverMsg = await sendMessageMutation.mutateAsync(payload);
                if (serverMsg) {
                    updateMessageWithServerResponse(tempId, {
                        id: serverMsg.id,
                        code: serverMsg.code,
                        messageText: serverMsg.messageText,
                        createDate: serverMsg.createDate,
                        timeStamp: serverMsg.createDate
                            ? generatePreciseTimestampFromDate(new Date(serverMsg.createDate))
                            : finalMessage.timeStamp,
                        messageType: serverMsg.messageType,
                        senderType: serverMsg.senderType,
                        replyToMessageId: serverMsg.replyToMessageId,
                        replyToMessageCode: serverMsg.replyToMessageCode,
                        replyToMessage: serverMsg.replyToMessage || null,
                        status: serverMsg.status,
                        chatInfoId: serverMsg.chatInfoId,
                        userName: serverMsg.userName,
                        userAvatar: serverMsg.userAvatar,
                        hasAttachment: serverMsg.hasAttachment,
                        isRead: serverMsg.isRead,
                        chatAttachments: serverMsg.chatAttachments?.length
                            ? serverMsg.chatAttachments.map((att: any) => ({
                                id: att.id,
                                chatMessageId: att.chatMessageId,
                                fileUrl: att.fileUrl,
                                fileName: att.fileName,
                                fileType: att.fileType,
                                fileSize: att.fileSize,
                                createDate: att.createDate,
                            }))
                            : finalMessage.chatAttachments,
                        attachments: [],
                    });
                }
            } catch (e) {
                updateMessageByTempId({ ...finalMessage, isError: true, messageText: "Gửi tin nhắn thất bại" });
                useToastStore.getState().showToast("Gửi tin nhắn thất bại", 3000, "error");
            } finally {
                setLoadingMessages(false);
            }
        }

        if (failedFiles.length > 0) {
            useToastStore.getState().showToast(
                `${failedFiles.length} file thất bại: ${failedFiles.join(", ")}`,
                4000,
                "warning"
            );
        }

        setTimeout(() => scrollToBottom(), 100);
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        await sendPickedFiles(files);
        e.target.value = "";
    };
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const totalCount = pendingFiles.length + pendingImages.length;
        const selectedCount = files.length;
        if (totalCount + selectedCount > 3) {
            useToastStore.getState().showToast(
                i18n.t("You can only send up to 3 images and files in total!"),
                2000,
                "warning"
            );
            e.target.value = "";
            return;
        }
        const arr: { name: string; url: string }[] = [];
        for (const file of Array.from(files)) {
            const uploaded = await uploadChatFile(file);
            uploaded.forEach(({ name, linkImage }) => {
                arr.push({ name, url: linkImage });
            });
        }
        addPendingFiles(arr);
        e.target.value = "";
    };

    const handleSendMessage = async (e: React.KeyboardEvent | React.MouseEvent, field: string, force?: boolean,) => {
        e.preventDefault();

        const isEmptyText = (text: string) => {
            return text.replace(/\s/g, "").length === 0;
        };
        const hasMessage = !isEmptyText(messageValue) || !isEmptyText(messageTranslate);
        const hasFiles = pendingImages.length > 0 || pendingFiles.length > 0;

        if (!hasMessage && !hasFiles) {
            return;
        }
        if (hasReachedLimit) {
            useToastStore.getState().showToast(
                i18n.t("You have reached the message limit for this chat."),
                2000,
                "warning"
            );
            return;
        }
        const textToSend = field === "inputTranslate" ? messageTranslate.trim() : messageValue.trim();
        const tempId = `temp_${Date.now()}_${Math.random()}`;
        const now = dayjs.utc();
        const filesArr = [
            ...pendingFiles.map(f => ({ name: f.name })),
            ...pendingImages.map((img, idx) => ({ name: typeof img === "string" ? img.split("/").pop() || `image_${idx}` : `image_${idx}` }))
        ];
        const payload: CreateSocialChatMessagePayload = {
            chatCode: roomId || null,
            messageText: textToSend,
            files: filesArr,
            replyToMessageCode: replyingToMessage?.code !== undefined && replyingToMessage?.code !== null ? String(replyingToMessage.code) : null,
            tempId: tempId,
        };
        clearReplyingToMessage();

        const pendingMsg: ChatMessage = {
            id: 1,
            tempId: tempId,
            messageText: textToSend,
            messageType: 1,
            senderType: 1,
            userId: currentUserId ?? 0,
            userName: "currentUserName",
            userAvatar: "currentUserAvatar",
            createDate: now.format("YYYY-MM-DDTHH:mm:ss.SSS"),
            timeStamp: generatePreciseTimestampFromDate(now.toDate()),
            chatInfoId: 1,
            code: roomId || "",
            status: 10,
            attachments: pendingImages.map(file => {
                if (typeof file === "string") {
                    return {
                        fileUrl: file,
                        fileName: "",
                        fileType: 1,
                    };
                } else {
                    return {
                        fileUrl: URL.createObjectURL(file),
                        fileName: file.name,
                        fileType: 1,
                    };
                }
            }),
            isSend: false,
            isError: false,
            hasAttachment: pendingImages.length > 0 ? 1 : 0,
            isRead: 0,
            isRevoked: 0,
            isEdited: 0,
            chatAttachments: [],
            chatInfo: null,
            reactions: [],
            replyToMessageId: replyingToMessage?.id || null,
            replyToMessage: replyingToMessage ?? null,
            replyToMessageCode: replyingToMessage?.code !== undefined && replyingToMessage?.code !== null ? String(replyingToMessage.code) : null
        };

        addMessage(pendingMsg);
        setMessageValue('');
        setMessageTranslate('');
        scrollToBottom();


        try {
            setLoadingMessages(true);
            const serverMsg = await sendMessageMutation.mutateAsync(payload);

            if (serverMsg) {
                updateMessageWithServerResponse(tempId, {
                    id: serverMsg.id,
                    code: serverMsg.code,
                    messageText: serverMsg.messageText,
                    createDate: serverMsg.createDate,
                    timeStamp: serverMsg.createDate ?
                        generatePreciseTimestampFromDate(new Date(serverMsg.createDate)) :
                        pendingMsg.timeStamp,
                    messageType: serverMsg.messageType,
                    senderType: serverMsg.senderType,
                    replyToMessageId: serverMsg.replyToMessageId,
                    replyToMessageCode: serverMsg.replyToMessageCode,
                    replyToMessage: serverMsg.replyToMessage || null,
                    status: serverMsg.status,
                    chatInfoId: serverMsg.chatInfoId,
                    userName: serverMsg.userName,
                    userAvatar: serverMsg.userAvatar,
                    hasAttachment: serverMsg.hasAttachment,
                    isRead: serverMsg.isRead,
                    attachments: serverMsg.chatAttachments?.length > 0 ?
                        serverMsg.chatAttachments.map((att: any) => ({
                            fileUrl: att.fileUrl,
                            fileName: att.fileName,
                            fileType: att.fileType,
                            createDate: att.createDate,
                        })) : pendingMsg.attachments,

                });
            }

        } catch (error) {
            console.error('Send message failed:', error);
            updateMessageByTempId({
                ...pendingMsg,
                isError: true,
                isSend: false
            });
        } finally {
            setLoadingMessages(false);

            scrollToBottom();

        }
    };

    const handleScrollWithLoadMore = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        onContainerScroll?.(e);
        recalc();
        const target = e.target as HTMLDivElement;
        const { scrollTop, scrollHeight, clientHeight } = target;



        if (scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
            const currentScrollHeight = scrollHeight;

            fetchNextPage()
                .then(() => {
                    requestAnimationFrame(() => {
                        const newScrollHeight = target.scrollHeight;
                        const heightDifference = newScrollHeight - currentScrollHeight;
                        target.scrollTop = scrollTop + heightDifference;
                    });
                })
                .catch((error) => {
                    console.error("Error fetching next page:", error);
                });
        }
    }, [onContainerScroll, hasNextPage, isFetchingNextPage, fetchNextPage, recalc]);

    const handleEditMessage = useCallback(async (messageCode: string | number, newText: string) => {
        try {
            updateMessageByCode(String(messageCode), {
                messageText: newText,
                isEdited: 1,
            });
            await updateMessageMutation.mutateAsync({
                messageCode: String(messageCode),
                messageText: newText
            });
        } catch (error) {
            console.error("Edit message failed:", error);
            const originalMessage = displayMessages.find(msg =>
                msg.code === String(messageCode) || msg.id === messageCode
            );
            if (originalMessage) {
                updateMessageByCode(String(messageCode), {
                    messageText: originalMessage.messageText,
                    isEdited: originalMessage.isEdited || 0,
                });
            }
        }
    }, [updateMessageByCode, updateMessageMutation, displayMessages]);
    const handleRevokeMessage = useCallback(async (messageCode: string | number) => {
        try {
            updateMessageByCode(String(messageCode), {
                isRevoked: 1,
                messageText: "",
            });

            await revokeMessageMutation.mutateAsync({
                messageCode: String(messageCode)
            });

        } catch (error) {
            console.error("Revoke message failed:", error);
            const originalMessage = displayMessages.find(msg =>
                msg.code === String(messageCode) || msg.id === messageCode
            );
            if (originalMessage) {
                updateMessageByCode(String(messageCode), {
                    isRevoked: originalMessage.isRevoked || 0,
                    messageText: originalMessage.messageText
                });
            }
        }
    }, [updateMessageByCode, revokeMessageMutation, displayMessages]);
    const handleTakePhoto = () => {
        localStorage.setItem("roomId", roomId);
        history.push("/social-chat/camera")
    }
    const handleTranslate = useCallback(
        async (text: string) => {
            if (!text?.trim()) return;

            setMessageTranslate("");

            try {
                const fromLanguageId = null;
                const toLanguageId = selectedLanguageSocialChat?.id || null;

                if (!toLanguageId) {
                    showToast(t("Please select a valid target language."), 3000, "error");
                    return;
                }

                const payload = {
                    fromLanguageId,
                    toLanguageId,
                    originalText: text.trim(),
                    context: null,
                    emotionType: null,
                };

                const result = await createTranslationMutation.mutateAsync(payload);

                if (result?.data) {
                    setMessageTranslate(result.data.translated_text || "");
                }
            } catch (err) {
                console.error("Translation failed:", err);
            }
        },
        [selectedLanguageSocialChat?.id, createTranslationMutation, showToast, t, setMessageTranslate]
    );
    return {
        handleImageChange,
        handleFileChange,
        handleSendMessage,
        handleScrollWithLoadMore,
        handleTranslate,
        handleEditMessage,
        handleRevokeMessage,
        handleTakePhoto,
        isLoading: sendMessageMutation.isLoading,
        sendPickedFiles,
    };
}