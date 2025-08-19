import React, { useCallback } from "react";
import { useChatStore } from "@/store/zustand/chat-store";

export const useMessageRetry = (
    handleSendMessage: (e: React.KeyboardEvent | React.MouseEvent, messageText?: string, attachments?: any) => void,
    setMessageValue: (value: string) => void,
    addPendingImages: (images: string[]) => void,
    addPendingFiles: (files: { name: string; url: string }[]) => void,
    mergeMessages: any,
    setMessageRetry: (value: string) => void,
    pendingImages: string[],
    pendingFiles: { name: string; url: string }[]

) => {
    const setPendingMessages = useChatStore((s) => s.setPendingMessages);
    const [retryId, setRetryId] = useState<string | undefined>();
    const retryMessage = useCallback(async (msgId: string) => {
        const targetMessage = mergeMessages.find((msg: any) =>
            String(msg.id) === String(msgId) ||
            String(msg.replyToMessageId) === String(msgId)
        );
        if (!targetMessage) {
            console.log('No target message found for ID:', msgId);
            return;
        }
        setPendingMessages((prev: any[]) =>
            prev.filter(msg =>
                String(msg.id) !== String(msgId) &&
                String(msg.replyToMessageId) !== String(msgId)
            )
        );
        if (targetMessage.attachments && targetMessage.attachments.length > 0) {
            const images = targetMessage.attachments
                .filter((att: { fileType: number }) => att.fileType === 10)
                .map((att: { fileUrl: string }) => att.fileUrl);
            const files = targetMessage.attachments
                .filter((att: { fileType: number }) => att.fileType !== 10)
                .map((att: { fileName: string; fileUrl: string }) => ({
                    name: att.fileName,
                    url: att.fileUrl,
                }));
            if (files.length > 0) addPendingFiles(files);
            if (images.length > 0) addPendingImages(images);
        }
        setMessageRetry(targetMessage.text || "");
        setMessageValue(targetMessage.text || "");
        setRetryId(msgId);
    }, [setPendingMessages, setMessageRetry, addPendingFiles, addPendingImages, handleSendMessage, mergeMessages]);
    useEffect(() => {
        if ( retryId) {
            handleSendMessage(new MouseEvent("click") as any);
            setRetryId(undefined); // reset
        }
    }, [retryId]);
    return { retryMessage };
};