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
    const MAX_IMAGE_SIZE = 150 * 1024 * 1024;

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
        const failedFiles: string[] = [];

        const validFiles: File[] = [];
        for (const file of files) {
            if (file.size > MAX_IMAGE_SIZE) {
                failedFiles.push(`${file.name} (>15MB)`);
                useToastStore.getState().showToast(`${file.name} quá lớn (>15MB)`, 3000, "warning");
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) {
            if (failedFiles.length > 0) {
                useToastStore.getState().showToast(
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
                isUploading: true,                // ✅ Bắt đầu với uploading
                isSending: false,                 // ✅ Chưa sending
                uploadProgress: 0,                // ✅ 0% progress
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
                replyingToMessage?.code !== undefined && replyingToMessage?.code !== null
                    ? String(replyingToMessage.code)
                    : null,
            isUploading: false,
    };

    // ✅ Add message ngay với uploading overlay
    addMessage(finalMessage);
    setTimeout(() => scrollToBottom(), 100);

    const uploadedFiles: { name: string; linkImage: string; localUrl: string; index: number }[] = [];
    
    try {
        setLoadingMessages(true);
        
        // ✅ Upload files với progress tracking
        const uploadPromises = validFiles.map(async (file, index) => {
            try {
                // ✅ Update progress 10%
                updateMessageWithServerResponse(tempId, {
                    chatAttachments: finalMessage.chatAttachments.map((att, i) => {
                        if (i === index) {
                            return {
                                ...att,
                                uploadProgress: 10,
                            };
                        }
                        return att;
                    })
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
                        index: index
                    });

                    // ✅ Update progress 70%
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
                        })
                    });

                    // ✅ Preload và update với server URL
                    await new Promise<void>((resolve) => {
                        const preloadImage = new Image();
                        
                        preloadImage.onload = () => {
                            // ✅ Upload done, set to sending
                            updateMessageWithServerResponse(tempId, {
                                chatAttachments: finalMessage.chatAttachments.map((att, i) => {
                                    if (i === index) {
                                        return {
                                            ...att,
                                            serverUrl: serverUrl,
                                            isUploading: false,  // ✅ Upload xong
                                            isSending: true,     // ✅ Bắt đầu sending
                                            uploadProgress: 100,
                                        };
                                    }
                                    return att;
                                })
                            });
                            resolve();
                        };
                        
                        preloadImage.onerror = () => {
                            updateMessageWithServerResponse(tempId, {
                                chatAttachments: finalMessage.chatAttachments.map((att, i) => {
                                    if (i === index) {
                                        return {
                                            ...att,
                                            isUploading: false,
                                            isSending: true,     // ✅ Vẫn sending dù preload fail
                                            uploadProgress: 100,
                                        };
                                    }
                                    return att;
                                })
                            });
                            resolve();
                        };
                        
                        setTimeout(() => resolve(), 3000); // Shorter timeout
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
                        })
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
                    })
                });
            }
        });

        await Promise.all(uploadPromises);

        // ✅ Send message - all images should be in sending state now
        if (uploadedFiles.length > 0) {
            uploadedFiles.sort((a, b) => a.index - b.index);

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
                const serverMsg = await sendMessageMutation.mutateAsync(payload);
                
                if (serverMsg) {
                    // ✅ Final update - remove sending state
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
                                    isSending: false, // ✅ Remove sending flag
                                    isUploading: false,
                                    uploadProgress: 100,
                                };
                            })
                            : finalMessage.chatAttachments.map(att => ({
                                ...att,
                                isSending: false, // ✅ Remove sending flag
                                isUploading: false,
                                uploadProgress: 100,
                            })),
                        attachments: [],
                    });
                }
            } catch (e) {
                console.error('Send message failed:', e);
                // ✅ Handle send error
                updateMessageWithServerResponse(tempId, {
                    isError: true,
                    isSend: false,
                    chatAttachments: finalMessage.chatAttachments.map(att => ({
                        ...att,
                        isSending: false, // ✅ Remove sending flag on error
                        isError: true,
                    })),
                    messageText: "Gửi tin nhắn thất bại"
                });
                useToastStore.getState().showToast("Gửi tin nhắn thất bại", 3000, "error");
            }
        }
    } catch (error) {
        console.error('Upload process failed:', error);
        updateMessageWithServerResponse(tempId, {
            isError: true,
            isSend: false,
            chatAttachments: finalMessage.chatAttachments.map(att => ({
                ...att,
                isSending: false,
                isUploading: false,
                isError: true,
            })),
            messageText: "Upload thất bại"
        });
    } finally {
        setLoadingMessages(false);
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

        const isEmptyText = (text: string | null | undefined): boolean => {
            if (!text) return true;
            const trimmedText = text.replace(/\s+/g, '');
            return trimmedText.length === 0 ||
                trimmedText === '' ||
                /^[\s\u200B\u2060\uFEFF]*$/g.test(text);
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
        if (isEmptyText(textToSend) && !hasFiles) { return }
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