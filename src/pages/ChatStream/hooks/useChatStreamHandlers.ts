/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { uploadChatFile } from "@/services/file/file-service";
import { createChatApi, createChatStreamApi } from "@/services/chat/chat-service";
import dayjs from "dayjs";
import { generatePreciseTimestampFromDate } from "@/utils/time-stamp";
import React from "react";
import { UseMutationResult, useQueryClient } from "react-query";
import { useChatStore } from "@/store/zustand/chat-store";
import { useToastStore } from "@/store/zustand/toast-store";
import i18n from "@/config/i18n";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import { TopicType } from "@/constants/topicType";

interface UseChatStreamHandlersProps {
    addPendingImages: (images: string[]) => void;
    addPendingFiles: (files: { name: string; url: string }[]) => void;
    setPendingMessages: any;
    setSignalRMessages: (messages: any[]) => void;
    clearAll: () => void;
    history: { replace: (path: string) => void };
    sessionId: string | null | undefined;
    topicType: string;
    pendingImages: (string | File)[];
    pendingFiles: { name: string; url: string }[];
    messageValue: string;
    setMessageValue: (value: string) => void;
    removePendingImage: (index: number) => void;
    removePendingFile: (index: number) => void;
    signalRMessages: any[];
    uploadImageMutation: UseMutationResult<any, unknown, File | Blob>;
    messagesEndRef: any;
    setHasFirstSignalRMessage: (value: boolean) => void;
    deviceInfo: { deviceId: string | null; language: string | null };
    stopMessages?: boolean;
    setStopMessages: (value: boolean) => void;
    removePendingImageByUrl: (url: string) => void;
    messageRetry: string;
    setMessageRetry: (value: string) => void;
}

export function useChatStreamHandlers({
    addPendingImages,
    addPendingFiles,
    setPendingMessages,
    clearAll,
    history,
    sessionId,
    topicType,
    pendingImages,
    pendingFiles,
    messageValue,
    setMessageValue,
    uploadImageMutation,
    messagesEndRef,
    setHasFirstSignalRMessage,
    setStopMessages,
    removePendingImageByUrl,
    messageRetry,
    setMessageRetry
}: UseChatStreamHandlersProps) {
    const scrollToBottom = useScrollToBottom(messagesEndRef);
    const queryClient = useQueryClient();
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const totalCount = pendingFiles.length + pendingImages.length;
        const selectedCount = files.length;
        if (totalCount + selectedCount > 3) {
            useToastStore.getState().showToast(
                t("You can only send up to 3 images and files in total!"),
                2000,
                "warning"
            );
            e.target.value = "";
            return;
        }
        const localUrls = Array.from(files).map(file => URL.createObjectURL(file));
        addPendingImages(localUrls);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const localUrl = localUrls[i];
            if (file.size > MAX_IMAGE_SIZE) {
                useToastStore.getState().showToast(
                    t("Photo must be less than 20MB!"),
                    3000,
                    "warning"
                );
                removePendingImageByUrl(localUrl);
                URL.revokeObjectURL(localUrl);
                continue;
            }
            try {
                const uploaded = await uploadImageMutation.mutateAsync(file);
                removePendingImageByUrl(localUrl);
                URL.revokeObjectURL(localUrl);
                if (uploaded && uploaded.length > 0) {
                    addPendingImages([uploaded[0].linkImage]);
                }
            } catch {
                removePendingImageByUrl(localUrl);
                URL.revokeObjectURL(localUrl);
                useToastStore.getState().showToast(
                    t("Image upload failed!"),
                    3000,
                    "error"
                );
            }
        }
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

    const handleSendMessage = async (e: React.KeyboardEvent | React.MouseEvent,) => {
        e.preventDefault();
        useChatStore.getState().setStopMessages(false);
        const setSession = useChatStore.getState().setSession;
        setSession(sessionId || "");
        const sessionCreatedAt = useChatStore.getState().sessionCreatedAt;
        setHasFirstSignalRMessage(true);
        const sessionIdAtSend = sessionCreatedAt;
        if (messageValue.trim() || pendingImages.length > 0 || pendingFiles.length > 0 || messageRetry.trim()) {
            setMessageValue("");
            setMessageRetry("");
            addPendingImages([]);
            addPendingFiles([]);
            clearAll();
            useChatStore.getState().setIsSending(true);

            let timeoutId: ReturnType<typeof setTimeout> | null = null;
            try {
                const filesArr = [
                    ...pendingFiles.map(f => ({ name: f.name })),
                    ...pendingImages.map((img, idx) => ({
                        name: typeof img === "string" ? img.split("/").pop() || `image_${idx}` : `image_${idx}`
                    }))
                ];

                const shortLang = i18n.language?.split("-")[0] || "en";
                const payload = {
                    chatCode: sessionId ?? null,
                    messageText: messageValue.trim() || messageRetry.trim(),
                    topic: Number(topicType),
                    files: filesArr.length > 0 ? filesArr : undefined,
                    language: shortLang,
                };

                const now = dayjs.utc();
                const attachments = [
                    ...pendingFiles.map(f => ({
                        fileUrl: f.url,
                        fileName: f.name,
                        fileType: f.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 10 : 20,
                        createDate: now.format("YYYY-MM-DDTHH:mm:ss"),
                    })),
                    ...pendingImages.map((img, idx) => ({
                        fileUrl: img,
                        fileName: typeof img === "string" ? img.split("/").pop() || `image_${idx}` : `image_${idx}`,
                        fileType: 10,
                        createDate: now.format("YYYY-MM-DDTHH:mm:ss"),
                    })),
                ];

                // Tạo temporary ID
                const tempId = `temp_${Date.now()}`;

                setPendingMessages((prev: any) => [
                    ...prev,
                    {
                        id: tempId, // Add temporary ID
                        text: messageValue.trim() || messageRetry.trim(),
                        createdAt: now.format("YYYY-MM-DDTHH:mm:ss.SSS"),
                        timeStamp: generatePreciseTimestampFromDate(now.toDate()),
                        attachments: attachments.length > 0 ? attachments : undefined,
                        files: attachments.length > 0 ? attachments.map(a => ({ name: a.fileName })) : undefined,
                        messageState: "SENDING",
                        isRight: true,
                    }
                ]);

                scrollToBottom();
                let res: any
                // if (parseInt(topicType) === TopicType.Chat || parseInt(topicType) === TopicType.FoodDiscovery) {
                    res = await createChatApi(payload);
                // } else {
                //     res = await createChatStreamApi(payload);
                // }
                if (timeoutId) clearTimeout(timeoutId);

                // Cập nhật pending message với data từ server
                if (res?.data?.userChatMessage) {
                    setPendingMessages((prev: any[]) => {
                        return prev.map(msg => {
                            if (msg.id === tempId) {
                                const serverMsg = res.data.userChatMessage;
                                return {
                                    ...msg,
                                    id: serverMsg.id, // Update với real ID từ server
                                    code: serverMsg.code,
                                    text: serverMsg.messageText || msg.text,
                                    createdAt: serverMsg.createDate || msg.createdAt,
                                    timeStamp: serverMsg.createDate ?
                                        generatePreciseTimestampFromDate(new Date(serverMsg.createDate)) :
                                        msg.timeStamp,
                                    messageType: serverMsg.messageType,
                                    senderType: serverMsg.senderType,
                                    replyToMessageId: serverMsg.replyToMessageId,
                                    status: serverMsg.status,
                                    chatInfoId: serverMsg.chatInfoId,
                                    userName: serverMsg.userName,
                                    chatCode: serverMsg.chatInfo?.code,
                                    messageState: "SENT", // Update state
                                    hasAttachment: serverMsg.hasAttachment,
                                    isRead: serverMsg.isRead,
                                    // Update attachments nếu có từ server
                                    attachments: serverMsg.chatAttachments?.length > 0 ?
                                        serverMsg.chatAttachments.map((att: any) => ({
                                            fileUrl: att.fileUrl,
                                            fileName: att.fileName,
                                            fileType: att.fileType,
                                            createDate: att.createDate,
                                        })) : msg.attachments,
                                };
                            }
                            return msg;
                        });
                    });

                    if (!sessionId) {
                        const newSessionId = res.data.userChatMessage.chatInfo.code;
                        queryClient.refetchQueries(["chatHistory"]);
                        history.replace(`/chat/${topicType}/${newSessionId}`);
                        setHasFirstSignalRMessage(true);
                        setStopMessages(false);
                    }
                }

            } catch (err) {
                if (timeoutId) clearTimeout(timeoutId);
                const sessionCreatedAt = useChatStore.getState().sessionCreatedAt;
                if (sessionIdAtSend !== sessionCreatedAt) return;

                useChatStore.getState().setIsSending(false);

                // Update message thành failed state
                setPendingMessages((prev: any) => [
                    ...prev,
                    {
                        text: t("Message sending failed, please try again!"),
                        createdAt: dayjs.utc().format("YYYY-MM-DDTHH:mm:ss.SSS"),
                        timeStamp: generatePreciseTimestampFromDate(new Date()),
                        isError: true,
                        isSend: true,
                        messageState: "FAILED",
                        id: `failed_${Date.now()}`,
                    }
                ]);
            }
        }
    };

    return {
        handleImageChange,
        handleFileChange,
        handleSendMessage,
    };
}