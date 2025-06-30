import { uploadChatFile } from "@/services/file/file-service";
import { createChatApi } from "@/services/chat/chat-service";
import dayjs from "dayjs";
import { generatePreciseTimestampFromDate } from "@/utils/time-stamp";
import React, { use } from "react";
import { UseMutationResult } from "react-query";
import { useChatStore } from "@/store/zustand/chat-store";
import { useToastStore } from "@/store/zustand/toast-store";
import i18n from "@/config/i18n";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";

interface UseChatHandlersProps {
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
}

export function useChatHandlers({
    addPendingImages,
    addPendingFiles,
    setPendingMessages,
    setSignalRMessages,
    clearAll,
    history,
    sessionId,
    topicType,
    pendingImages,
    pendingFiles,
    messageValue,
    setMessageValue,
    removePendingImage,
    removePendingFile,
    signalRMessages,
    uploadImageMutation,
    messagesEndRef,
    setHasFirstSignalRMessage,
    deviceInfo,
    stopMessages,
    setStopMessages
}: UseChatHandlersProps) {
    const scrollToBottom = useScrollToBottom(messagesEndRef);
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const totalCount = pendingFiles.length + pendingImages.length;
        const selectedCount = files.length;
        if (totalCount + selectedCount > 3) {
            useToastStore.getState().showToast(t("You can only send up to 3 images and files in total!"), 2000, "warning");
            e.target.value = "";
            return;
        }
        for (const file of Array.from(files)) {
            await uploadImageMutation.mutateAsync(file, {
                onSuccess: (uploaded) => {
                    if (uploaded && uploaded.length > 0) {
                        addPendingImages([uploaded[0].linkImage]);
                    }
                },
            });
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

    const handleSendMessage = async (e: React.KeyboardEvent | React.MouseEvent, force?: boolean) => {
        e.preventDefault();
        useChatStore.getState().setStopMessages(false);

        if (messageValue.trim() || pendingImages.length > 0 || pendingFiles.length > 0) {
            setMessageValue("");
            addPendingImages([]);
            addPendingFiles([]);
            clearAll();
            useChatStore.getState().setIsSending(true);

            let timeoutId: ReturnType<typeof setTimeout> | null = null;
            try {
                timeoutId = setTimeout(() => {
                    useChatStore.getState().setIsSending(false);
                    setPendingMessages((prev: any) => [
                        ...prev,
                        {
                            text: t("Message sending failed, please try again!"),
                            createdAt: dayjs.utc().format("YYYY-MM-DDTHH:mm:ss.SSS"),
                            timeStamp: generatePreciseTimestampFromDate(new Date()),
                            isError: true,
                        }
                    ]);
                }, 1000 * 60);

                const filesArr = [
                    ...pendingFiles.map(f => ({ name: f.name })),
                    ...pendingImages.map((img, idx) => ({ name: typeof img === "string" ? img.split("/").pop() || `image_${idx}` : `image_${idx}` }))
                ];
                const payload = {
                    chatCode: sessionId ?? null,
                    messageText: messageValue.trim(),
                    topic: Number(topicType),
                    files: filesArr.length > 0 ? filesArr : undefined,
                    language: i18n.language || "en",
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

                setPendingMessages((prev: any) => [
                    ...prev,
                    {
                        text: messageValue.trim(),
                        createdAt: now.format("YYYY-MM-DDTHH:mm:ss.SSS"),
                        timeStamp: generatePreciseTimestampFromDate(now.toDate()),
                        attachments: attachments.length > 0 ? attachments : undefined,
                        files: attachments.length > 0 ? attachments.map(a => ({ name: a.fileName })) : undefined,
                    }
                ]);

                scrollToBottom();
                const res = await createChatApi(payload);

                if (timeoutId) clearTimeout(timeoutId);
                if (res?.data?.userChatMessage && !useChatStore.getState().stopMessages) {
                    if (!sessionId) {
                        history.replace(`/chat/${topicType}/${res.data.userChatMessage.chatInfo.code}`);
                        setHasFirstSignalRMessage(true);
                        setStopMessages(false);
                    }
                }
            } catch (err) {
                if (timeoutId) clearTimeout(timeoutId);
                useChatStore.getState().setIsSending(false);
                setPendingMessages((prev: any) => [
                    ...prev,
                    {
                        text: t("Message sending failed, please try again!"),
                        createdAt: dayjs.utc().format("YYYY-MM-DDTHH:mm:ss.SSS"),
                        timeStamp: generatePreciseTimestampFromDate(new Date()),
                        isError: true,
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