import { i18n } from "i18next";
import { UpdateSocialChatMessagePayload } from "./../../../../services/social/social-chat-type";
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { uploadChatFile } from "@/services/file/file-service";
import React, { useCallback } from "react";
import { UseMutationResult } from "react-query";
import { useToastStore } from "@/store/zustand/toast-store";
import { useTranslation } from "react-i18next";
import { PendingFile } from "../components/PendingFilesList";
import dayjs from "dayjs";
import { ChatMessage } from "@/types/social-chat";
import {
    useSendSocialChatMessage,
    useUpdateSocialChatMessage,
} from "../../hooks/useSocialChat";
import { CreateSocialChatMessagePayload } from "@/services/social/social-chat-type";
import { useAuthStore } from "@/store/zustand/auth-store";
import { Language } from "@/store/zustand/language-store";
import { generatePreciseTimestampFromDate } from "@/utils/time-stamp";
import { isEmptyText } from "@/utils/text";
interface UseSocialChatHandlersProps {
    addPendingImages: (images: string[]) => void;
    addPendingFiles: (files: { name: string; url: string }[]) => void;
    pendingImages: (string | File)[];
    pendingFiles: { name: string; url: string }[];
    chatPendingFiles: PendingFile[];
    clearPendingFiles: () => void;
    messageValue: string;
    setMessageValue: (value: string) => void;
    uploadImageMutation: UseMutationResult<any, unknown, File | Blob>;
    removePendingImageByUrl: (url: string) => void;
    scrollToBottom: () => void;
    roomId: string;
    addMessage: (message: ChatMessage) => void;
    updateMessageByTempId: (message: ChatMessage) => void;
    updateMessageWithServerResponse: (
        tempId: string,
        serverData: Partial<ChatMessage>
    ) => void;
    updateOldMessagesWithReadStatus: (
        roomId: string,
        newUserHasRead: any[],
        currentUserId: number
    ) => void;
    setLoadingMessages: (loading: boolean) => void;
    onContainerScroll: any;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    fetchNextPage: () => Promise<void>;
    updateMessageByCode: (
        messageCode: string,
        updatedData: Partial<ChatMessage>
    ) => void;
    displayMessages: ChatMessage[];
    updateMessageMutation: UseMutationResult<
        ChatMessage,
        unknown,
        UpdateSocialChatMessagePayload
    >;
    revokeMessageMutation: UseMutationResult<
        any,
        unknown,
        { messageCode: string }
    >;
    replyingToMessage: ChatMessage | null;
    history: any;
    clearReplyingToMessage: () => void;
    hasReachedLimit?: boolean;
    selectedLanguageSocialChat?: Language | null;
    createTranslationMutation: any;
    setMessageTranslate: (text: string) => void;
    messageTranslate: string;
    showToast: (
        message: string,
        duration?: number,
        type?: "success" | "error" | "warning"
    ) => void;
    t: (key: string) => string;
    recalc: () => void;
}

export function useSocialChatHandlers({
    addPendingImages,
    addPendingFiles,
    pendingImages,
    pendingFiles,
    // chatPendingFiles,
    clearPendingFiles,
    // messageValue,
    setMessageValue,
    uploadImageMutation,
    removePendingImageByUrl,
    scrollToBottom,
    addMessage,
    updateMessageByTempId,
    updateMessageWithServerResponse,
    updateOldMessagesWithReadStatus,
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
    // messageTranslate,
    showToast,
    t,
    recalc,
}: UseSocialChatHandlersProps) {
    const currentUserId = useAuthStore.getState().user?.id;
    const sendMessageMutation = useSendSocialChatMessage({ roomId });
    const MAX_IMAGE_SIZE = 150 * 1024 * 1024;

    const cleanImageUrl = (url: string): string => {
        if (!url) return url;

        const protocolDomainRegex = /(https?:\/\/[^\/]+)/g;
        const matches = url.match(protocolDomainRegex);

        if (matches && matches.length > 1) {
            const firstDomain = matches[0];
            const restOfUrl = url
                .split(matches[0])
                .slice(1)
                .join("")
                .replace(/^\/+/, "");
            let cleanedRest = restOfUrl;
            matches.slice(1).forEach((duplicateDomain) => {
                cleanedRest = cleanedRest
                    .replace(duplicateDomain + "/", "")
                    .replace(duplicateDomain, "");
            });

            return `${firstDomain}/${cleanedRest}`;
        }

        return url;
    };

    const sendPickedFiles = async (files: File[]) => {
        clearReplyingToMessage();
        const failedFiles: string[] = [];

        const validFiles: File[] = [];
        for (const file of files) {
            if (file.size > MAX_IMAGE_SIZE) {
                failedFiles.push(`${file.name} (>15MB)`);
                useToastStore
                    .getState()
                    .showToast(`${file.name} quá lớn (>15MB)`, 3000, "warning");
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) {
            if (failedFiles.length > 0) {
                useToastStore
                    .getState()
                    .showToast(
                        `${failedFiles.length} file thất bại: ${failedFiles.join(", ")}`,
                        4000,
                        "warning"
                    );
            }
            return;
        }

        const tempId = `temp_${Date.now()}_${Math.random()}`;
        const now = dayjs.utc();
        const baseId = Date.now();

        const localChatAttachments = validFiles.map((file, i) => {
            const blobUrl = URL.createObjectURL(file);
            return {
                id: baseId + i,
                tempAttachmentId: `${tempId}_${i}`,
                chatMessageId: 0,
                fileUrl: blobUrl,
                fileName: file.name,
                fileType: 1,
                fileSize: file.size,
                originalIndex: i,
                createDate: now.format("YYYY-MM-DDTHH:mm:ss.SSS"),
                localUrl: blobUrl,
                serverUrl: undefined,
                isUploading: true,
                isSending: false,
                uploadProgress: 0,
            };
        });

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
            chatAttachments: localChatAttachments,
            chatInfo: null,
            reactions: [],
            replyToMessageId: replyingToMessage?.id ?? null,
            replyToMessage: replyingToMessage ?? null,
            replyToMessageCode:
                replyingToMessage?.code !== undefined &&
                    replyingToMessage?.code !== null
                    ? String(replyingToMessage.code)
                    : null,
            isUploading: false,
        };

        addMessage(finalMessage);
        setTimeout(() => scrollToBottom(), 100);

        const uploadedFiles: {
            name: string;
            linkImage: string;
            localUrl: string;
            index: number;
        }[] = [];

        try {
            setLoadingMessages(true);
            const uploadPromises = validFiles.map(async (file, index) => {
                try {
                    updateMessageWithServerResponse(tempId, {
                        chatAttachments: finalMessage.chatAttachments.map((att, i) => {
                            if (i === index) {
                                return {
                                    ...att,
                                    uploadProgress: 10,
                                };
                            }
                            return att;
                        }),
                    });

                    const localUrl = localChatAttachments[index].fileUrl;
                    const uploaded = await uploadImageMutation.mutateAsync(file);

                    if (uploaded?.length) {
                        const serverFile = uploaded[0];
                        const serverUrl = cleanImageUrl(serverFile.linkImage);

                        uploadedFiles.push({
                            name: serverFile.name,
                            linkImage: serverUrl,
                            localUrl: localUrl,
                            index: index,
                        });
                        updateMessageWithServerResponse(tempId, {
                            chatAttachments: finalMessage.chatAttachments.map((att, i) => {
                                if (i === index) {
                                    return {
                                        ...att,
                                        uploadProgress: 70,
                                        serverUrl: serverUrl,
                                    };
                                }
                                return att;
                            }),
                        });
                        await new Promise<void>((resolve) => {
                            const preloadImage = new Image();
                            preloadImage.onload = () => {
                                updateMessageWithServerResponse(tempId, {
                                    chatAttachments: finalMessage.chatAttachments.map(
                                        (att, i) => {
                                            if (i === index) {
                                                return {
                                                    ...att,
                                                    serverUrl: serverUrl,
                                                    isUploading: false,
                                                    isSending: true,
                                                    uploadProgress: 100,
                                                };
                                            }
                                            return att;
                                        }
                                    ),
                                });
                                resolve();
                            };

                            preloadImage.onerror = () => {
                                updateMessageWithServerResponse(tempId, {
                                    chatAttachments: finalMessage.chatAttachments.map(
                                        (att, i) => {
                                            if (i === index) {
                                                return {
                                                    ...att,
                                                    isUploading: false,
                                                    isSending: true,
                                                    uploadProgress: 100,
                                                };
                                            }
                                            return att;
                                        }
                                    ),
                                });
                                resolve();
                            };

                            setTimeout(() => resolve(), 3000);
                            preloadImage.src = serverUrl;
                        });
                    } else {
                        failedFiles.push(`${file.name} (no response)`);
                        updateMessageWithServerResponse(tempId, {
                            chatAttachments: finalMessage.chatAttachments.map((att, i) => {
                                if (i === index) {
                                    return {
                                        ...att,
                                        isUploading: false,
                                        isError: true,
                                    };
                                }
                                return att;
                            }),
                        });
                    }
                } catch (e) {
                    failedFiles.push(`${file.name} (upload failed)`);
                    updateMessageWithServerResponse(tempId, {
                        chatAttachments: finalMessage.chatAttachments.map((att, i) => {
                            if (i === index) {
                                return {
                                    ...att,
                                    isUploading: false,
                                    isError: true,
                                };
                            }
                            return att;
                        }),
                    });
                }
            });

            await Promise.all(uploadPromises);
            if (uploadedFiles.length > 0) {
                uploadedFiles.sort((a, b) => a.index - b.index);
                const payload: CreateSocialChatMessagePayload = {
                    chatCode: roomId || null,
                    messageText: "",
                    files: uploadedFiles.map((f) => ({ name: f.name })),
                    replyToMessageCode:
                        replyingToMessage?.code !== undefined &&
                            replyingToMessage?.code !== null
                            ? String(replyingToMessage.code)
                            : null,
                    tempId,
                };
                try {
                    const serverMsg = await sendMessageMutation.mutateAsync(payload);
                    if (serverMsg) {
                        updateMessageWithServerResponse(tempId, {
                            id: serverMsg.id,
                            code: serverMsg.code,
                            messageText: serverMsg.messageText,
                            createDate: serverMsg.createDate,
                            timeStamp: serverMsg.createDate
                                ? generatePreciseTimestampFromDate(
                                    new Date(serverMsg.createDate)
                                )
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
                            isSend: true,
                            isError: false,
                            chatAttachments: serverMsg.chatAttachments?.length
                                ? serverMsg.chatAttachments.map((att: any, index: number) => {
                                    const localAtt: any = finalMessage.chatAttachments[index];
                                    return {
                                        id: att.id,
                                        chatMessageId: att.chatMessageId,
                                        fileUrl: att.fileUrl,
                                        fileName: att.fileName,
                                        fileType: att.fileType,
                                        fileSize: att.fileSize,
                                        createDate: att.createDate,
                                        originalIndex: localAtt?.originalIndex ?? index,
                                        isSending: false,
                                        isUploading: false,
                                        uploadProgress: 100,
                                    };
                                })
                                : finalMessage.chatAttachments.map((att) => ({
                                    ...att,
                                    isSending: false,
                                    isUploading: false,
                                    uploadProgress: 100,
                                })),
                            attachments: [],
                        });
                        if (serverMsg.userHasRead && serverMsg.userHasRead.length > 1) {
                            updateOldMessagesWithReadStatus(
                                roomId,
                                serverMsg.userHasRead,
                                finalMessage.userId
                            );
                        }
                    }
                } catch (e) {
                    console.error("Send message failed:", e);
                    updateMessageWithServerResponse(tempId, {
                        isError: true,
                        isSend: false,
                        chatAttachments: finalMessage.chatAttachments.map((att) => ({
                            ...att,
                            isSending: false,
                            isError: true,
                        })),
                        messageText: "Gửi tin nhắn thất bại",
                    });
                    useToastStore
                        .getState()
                        .showToast("Gửi tin nhắn thất bại", 3000, "error");
                }
            }
        } catch (error) {
            console.error("Upload process failed:", error);
            updateMessageWithServerResponse(tempId, {
                isError: true,
                isSend: false,
                chatAttachments: finalMessage.chatAttachments.map((att) => ({
                    ...att,
                    isSending: false,
                    isUploading: false,
                    isError: true,
                })),
                messageText: "Upload thất bại",
            });
        } finally {
            setLoadingMessages(false);
        }

        if (failedFiles.length > 0) {
            useToastStore
                .getState()
                .showToast(
                    `${failedFiles.length} file thất bại: ${failedFiles.join(", ")}`,
                    4000,
                    "warning"
                );
        }

        setTimeout(() => scrollToBottom(), 100);
    };
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) {
            e.target.value = "";
            return;
        }
        const isImageFile = (f: File) =>
            (f.type && f.type.startsWith("image/")) ||
            /\.(jpeg|png|gif|webp|svg|heic|heif)$/i.test(f.name);
        const imageFiles = files.filter(isImageFile);
        const invalidFiles = files.filter((f) => !isImageFile(f));
        if (invalidFiles.length > 0) {
            showToast(
                `${invalidFiles.length} file không phải ảnh: ${invalidFiles
                    .map((f) => f.name)
                    .join(", ")}`,
                4000,
                "warning"
            );
            return;
        }
        await sendPickedFiles(files);
        if (imageFiles.length === 0) {
            e.target.value = "";
            return;
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const totalCount = pendingFiles.length + pendingImages.length;
        const selectedCount = files.length;
        if (totalCount + selectedCount > 3) {
            useToastStore
                .getState()
                .showToast(
                    t("You can only send up to 3 images and files in total!"),
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

    const handleSendMessage = async (
        e: React.KeyboardEvent | React.MouseEvent,
        field: string,
        force?: boolean,
        messageValue?: string,
        messageTranslate?: string,
        chatPendingFiles?: PendingFile[]
    ) => {
        e.preventDefault();

        const hasMessage =
            !isEmptyText(messageValue) || !isEmptyText(messageTranslate);
        const hasFiles = (chatPendingFiles ?? []).length > 0;
        if (!hasMessage && !hasFiles) {
            return;
        }
        if (hasReachedLimit) {
            useToastStore
                .getState()
                .showToast(
                    t("You have reached the message limit for this chat."),
                    2000,
                    "warning"
                );
            return;
        }
        const textToSend =
            field === "inputTranslate"
                ? (messageTranslate ?? "").trim()
                : (messageValue ?? "").trim();
        if (isEmptyText(textToSend) && !hasFiles) {
            return;
        }
        const tempId = `temp_${Date.now()}_${Math.random()}`;
        const now = dayjs.utc();
        const filesArr = (chatPendingFiles ?? [])
            .filter((f) => !f.isUploading && !f.error && f.serverName)
            .map((f) => ({ name: f.serverName! }));
        const hasMessAndFiles = !isEmptyText(textToSend) && hasFiles;
        const payloads: CreateSocialChatMessagePayload[] = [];
        if (hasMessAndFiles) {
            // Payload 1: text
            payloads.push({
                chatCode: roomId || null,
                messageText: textToSend,
                files: [],
                replyToMessageCode:
                    replyingToMessage?.code != null
                        ? String(replyingToMessage.code)
                        : null,
                tempId: `temp_text_${Date.now()}_${Math.random()}`,
            });

            payloads.push({
                chatCode: roomId || null,
                messageText: "",
                files: filesArr,
                replyToMessageCode: null, 
                tempId: `temp_file_${Date.now()}_${Math.random()}`,
            });
        } else {
            payloads.push({
                chatCode: roomId || null,
                messageText: textToSend,
                files: filesArr,
                replyToMessageCode:
                    replyingToMessage?.code != null
                        ? String(replyingToMessage.code)
                        : null,
                tempId: `temp_${Date.now()}_${Math.random()}`,
            });
        }

        clearReplyingToMessage();
        const pendingMessages: ChatMessage[] = [];
        for (let i = 0; i < payloads.length; i++) {
            const payload:any = payloads[i];
            const isTextMessage = payload.messageText !== "";
            const isFileMessage = payload.files.length > 0;
            const pendingMsg: ChatMessage = {
                id: 1,
                tempId: payload.tempId,
                messageText: payload.messageText,
                messageType: 1,
                senderType: 1,
                userId: currentUserId ?? 0,
                userName: "currentUserName",
                userAvatar: "currentUserAvatar",
                createDate: now.add(i, "millisecond").format("YYYY-MM-DDTHH:mm:ss.SSS"),
                timeStamp: generatePreciseTimestampFromDate(
                    now.add(i, "millisecond").toDate()
                ),
                chatInfoId: 1,
                code: payload.tempId || "",
                status: 10,
                isSend: false,
                isError: false,
                hasAttachment: isFileMessage ? 1 : 0,
                isRead: 0,
                isRevoked: 0,
                isEdited: 0,
                chatAttachments: isFileMessage
                    ? (chatPendingFiles ?? []).map((file, index) => ({
                        id: -index - 1,
                        chatMessageId: -1,
                        fileUrl: file.url || "",
                        fileName: file.name,
                        fileType:
                            file.type === "image" ? 1 : file.type === "video" ? 2 : 3,
                        fileSize: file?.file?.size ?? 0,
                        createDate: new Date().toISOString(),
                        isUploading: true,
                        isError: false,
                        localUrl: file.url,
                    }))
                    : [],
                chatInfo: null,
                reactions: [],
                replyToMessageId: i === 0 ? replyingToMessage?.id || null : null,
                replyToMessage: i === 0 ? replyingToMessage ?? null : null,
                replyToMessageCode: i === 0 ? payload.replyToMessageCode : null,
            };
            pendingMessages.push(pendingMsg);
            addMessage(pendingMsg);
        }

        setMessageValue("");
        setMessageTranslate("");
        scrollToBottom();
        clearPendingFiles();
        const apiPromises: Promise<any>[] = [];

        for (let i = 0; i < payloads.length; i++) {
            const payload:any = payloads[i];
            const pendingMsg = pendingMessages[i];
            const isFileMessage = payload?.files?.length > 0;

            const apiCall = async () => {
                if (isFileMessage && hasMessAndFiles) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }

                try {
                    const serverMsg = await sendMessageMutation.mutateAsync(payload);

                    if (serverMsg) {
                        updateMessageWithServerResponse(payload.tempId, {
                            id: serverMsg.id,
                            code: serverMsg.code,
                            messageText: serverMsg.messageText,
                            createDate: serverMsg.createDate,
                            timeStamp: serverMsg.createDate
                                ? generatePreciseTimestampFromDate(
                                    new Date(serverMsg.createDate)
                                )
                                : pendingMsg.timeStamp,
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
                            userHasRead: serverMsg.userHasRead || [],
                            chatAttachments:
                                serverMsg.chatAttachments?.length > 0
                                    ? serverMsg.chatAttachments.map((att: any) => ({
                                        fileUrl: att.fileUrl,
                                        fileName: att.fileName,
                                        fileType: att.fileType,
                                        createDate: att.createDate,
                                    }))
                                    : pendingMsg.chatAttachments,
                            isSend: true,
                            isError: false,
                        });

                        if (serverMsg.userHasRead && serverMsg.userHasRead.length > 1) {
                            updateOldMessagesWithReadStatus(
                                roomId,
                                serverMsg.userHasRead,
                                pendingMsg.userId
                            );
                        }
                    }
                } catch (error) {
                    console.error("Send message failed:", error);
                    updateMessageByTempId({
                        ...pendingMsg,
                        isError: true,
                        isSend: false,
                    });
                }
            };

            apiPromises.push(apiCall());
        }

        try {
            setLoadingMessages(true);
            await Promise.allSettled(apiPromises);

            if ((chatPendingFiles?.length ?? 0) > 0) {
                clearPendingFiles();
            }
        } finally {
            setLoadingMessages(false);
        }

        scrollToBottom();
    };

    const handleScrollWithLoadMore = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
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
        },
        [onContainerScroll, hasNextPage, isFetchingNextPage, fetchNextPage, recalc]
    );

    const handleEditMessage = useCallback(
        async (messageCode: string | number, newText: string) => {
            try {
                updateMessageByCode(String(messageCode), {
                    messageText: newText,
                    isEdited: 1,
                });
                await updateMessageMutation.mutateAsync({
                    messageCode: String(messageCode),
                    messageText: newText,
                });
            } catch (error) {
                console.error("Edit message failed:", error);
                const originalMessage = displayMessages.find(
                    (msg) => msg.code === String(messageCode) || msg.id === messageCode
                );
                if (originalMessage) {
                    updateMessageByCode(String(messageCode), {
                        messageText: originalMessage.messageText,
                        isEdited: originalMessage.isEdited || 0,
                    });
                }
            }
        },
        [updateMessageByCode, updateMessageMutation, displayMessages]
    );

    const handleRevokeMessage = useCallback(
        async (messageCode: string | number) => {
            try {
                updateMessageByCode(String(messageCode), {
                    isRevoked: 1,
                    messageText: "",
                });

                await revokeMessageMutation.mutateAsync({
                    messageCode: String(messageCode),
                });
            } catch (error) {
                console.error("Revoke message failed:", error);
                const originalMessage = displayMessages.find(
                    (msg) => msg.code === String(messageCode) || msg.id === messageCode
                );
                if (originalMessage) {
                    updateMessageByCode(String(messageCode), {
                        isRevoked: originalMessage.isRevoked || 0,
                        messageText: originalMessage.messageText,
                    });
                }
            }
        },
        [updateMessageByCode, revokeMessageMutation, displayMessages]
    );
    const handleTakePhoto = () => {
        localStorage.setItem("roomId", roomId);
        history.push("/social-chat/camera");
    };
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
        [
            selectedLanguageSocialChat?.id,
            createTranslationMutation,
            showToast,
            t,
            setMessageTranslate,
        ]
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
