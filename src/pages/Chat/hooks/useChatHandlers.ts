import { uploadChatFile } from "@/services/file/file-service";
import { createChatApi } from "@/services/chat/chat-service";
import dayjs from "dayjs";
import { generatePreciseTimestampFromDate } from "@/utils/time-stamp";
import React from "react";
import { UseMutationResult } from "react-query";
import { useChatStore } from "@/store/zustand/chat-store";
import { useToastStore } from "@/store/zustand/toast-store";

interface UseChatHandlersProps {
    addPendingImages: (images: string[]) => void;
    addPendingFiles: (files: { name: string; url: string }[]) => void;
    setPendingMessages: (fn: (prev: any) => any) => void;
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
    setHasFirstSignalRMessage
}: UseChatHandlersProps) {
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
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
                    useToastStore.getState().showToast(
                        t("Message sending failed, please try again!"),
                        3000,
                        "error"
                    );
                }, 15000);

                const filesArr = [
                    ...pendingFiles.map(f => ({ name: f.name })),
                    ...pendingImages.map((img, idx) => ({ name: typeof img === "string" ? img.split("/").pop() || `image_${idx}` : `image_${idx}` }))
                ];

                const payload = {
                    chatCode: sessionId ?? null,
                    messageText: messageValue.trim(),
                    topic: Number(topicType),
                    files: filesArr.length > 0 ? filesArr : undefined,
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

                const res = await createChatApi(payload);

                if (timeoutId) clearTimeout(timeoutId);

                if (res?.data?.userChatMessage) {
                    if (!sessionId) {
                        history.replace(`/chat/${topicType}/${res.data.userChatMessage.chatInfo.code}`);
                        setHasFirstSignalRMessage(true);
                    }
                }
            } catch (err) {
                if (timeoutId) clearTimeout(timeoutId);
                useChatStore.getState().setIsSending(false);
                useToastStore.getState().showToast(
                    t("Message sending failed, please try again!"),
                    3000,
                    "error"
                );
            }
        }
    };

    return {
        handleImageChange,
        handleFileChange,
        handleSendMessage,
    };
}