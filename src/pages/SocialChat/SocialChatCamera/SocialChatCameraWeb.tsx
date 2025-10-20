import { uploadChatFile } from "@/services/file/file-service";
import { Capacitor } from "@capacitor/core";
import { useIonToast } from "@ionic/react";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useParams } from "react-router";
import CameraIcon from "@/icons/logo/chat/cam.svg?react";
import { useSocialChatStore } from "@/store/zustand/social-chat-store";
import { useToastStore } from "@/store/zustand/toast-store";
import { useSendSocialChatMessage } from "@/pages/SocialChat/hooks/useSocialChat";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";
import { generatePreciseTimestampFromDate } from "@/utils/time-stamp";
import { ChatMessage } from "@/types/social-chat";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; 

const SocialChatCameraWeb: React.FC = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [present, dismiss] = useIonToast();
    const { t } = useTranslation();
    const roomId = localStorage.getItem("roomId") || useParams<{ roomId?: string }>().roomId;
    const {
        addMessage,
        updateMessageByTempId,
        updateMessageWithServerResponse,
        setLoadingMessages,
        replyingToMessageByRoomId,
        updateOldMessagesWithReadStatus
    } = useSocialChatStore();

    const showToast = useToastStore((state) => state.showToast);
    const { data: userInfo } = useAuthInfo();
    const sendMessageMutation = useSendSocialChatMessage();
    const replyingToMessage = roomId ? replyingToMessageByRoomId[roomId] || null : null;

    const handleUploadImageFile = async (file: File) => {
        const tempId = `temp_image_${Date.now()}`;
        const now = dayjs.utc();

        const tempMessage: ChatMessage = {
            id: Date.now(),
            tempId: tempId,
            messageText: "",
            messageType: 1,
            senderType: 1,
            userId: userInfo?.id ?? 0,
            userName: userInfo?.name || "You",
            userAvatar: userInfo?.avatar || "",
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
            chatAttachments: [{
                id: Date.now(),
                chatMessageId: 0,
                fileUrl: URL.createObjectURL(file),
                fileName: file.name,
                fileType: 1,
                fileSize: file.size,
                createDate: dayjs.utc().format("YYYY-MM-DDTHH:mm:ss.SSS"),
                isUploading: true,
            }],
            chatInfo: null,
            reactions: [],
            replyToMessageId: replyingToMessage?.id || null,
            replyToMessage: replyingToMessage ?? null,
            replyToMessageCode: replyingToMessage?.code ? String(replyingToMessage.code) : null
        };

        if (roomId) {
            addMessage(roomId, tempMessage);
        }

        try {
            if (file.size > MAX_IMAGE_SIZE) {
                present({
                    message: t("Photo must be less than 10MB!"),
                    duration: 3000,
                    color: "danger",
                });

                if (roomId) {
                    updateMessageByTempId(roomId, {
                        ...tempMessage,
                        isError: true,
                        messageText: "Ảnh quá lớn (>10MB)"
                    });
                }
                URL.revokeObjectURL(tempMessage.chatAttachments[0].fileUrl);
                return;
            }
            const uploaded = await uploadChatFile(file);
            URL.revokeObjectURL(tempMessage.chatAttachments[0].fileUrl);
            if (uploaded?.length && roomId) {
                const uploadedFile = uploaded[0];
                const payload = {
                    chatCode: roomId,
                    messageText: "",
                    files: [{ name: uploadedFile.name }],
                    replyToMessageCode: replyingToMessage?.code ? String(replyingToMessage.code) : null,
                    tempId: tempId,
                };

                try {
                    setLoadingMessages(roomId, true);
                    const serverMsg = await sendMessageMutation.mutateAsync(payload);

                    if (serverMsg) {
                        updateMessageWithServerResponse(roomId, tempId, {
                            id: serverMsg.id,
                            code: serverMsg.code,
                            messageText: serverMsg.messageText,
                            createDate: serverMsg.createDate,
                            timeStamp: serverMsg.createDate ?
                                generatePreciseTimestampFromDate(new Date(serverMsg.createDate)) :
                                tempMessage.timeStamp,
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
                            chatAttachments: serverMsg.chatAttachments?.length
                                ? serverMsg.chatAttachments.map((att: any) => ({
                                    id: att.id,
                                    chatMessageId: att.chatMessageId,
                                    fileUrl: att.fileUrl,
                                    fileName: att.fileName,
                                    fileType: att.fileType,
                                    fileSize: att.fileSize,
                                    createDate: att.createDate,
                                    isSending: false,
                                    isUploading: false,
                                    uploadProgress: 100,
                                }))
                                : tempMessage.chatAttachments.map(att => ({
                                    ...att,
                                    isSending: false,
                                    isUploading: false,
                                    uploadProgress: 100,
                                })),
                            attachments: serverMsg.chatAttachments?.length > 0 ?
                                serverMsg.chatAttachments.map((att: any) => ({
                                    fileUrl: att.fileUrl,
                                    fileName: att.fileName,
                                    fileType: att.fileType,
                                    createDate: att.createDate,
                                })) : [],
                            isSend: true,
                            isError: false,
                        });

                        if (serverMsg.userHasRead && serverMsg.userHasRead.length > 0) {
                            updateOldMessagesWithReadStatus(
                                roomId, 
                                serverMsg.userHasRead, 
                                tempMessage.userId
                            );
                        }
                        
                        setLoadingMessages(roomId, false);
                    }
                } catch (e) {
                    console.error('Send message failed:', e);
                    updateMessageByTempId(roomId, {
                        ...tempMessage,
                        isError: true,
                        isSend: false,
                        chatAttachments: tempMessage.chatAttachments.map(att => ({
                            ...att,
                            isSending: false,
                            isError: true,
                        })),
                        messageText: "Gửi tin nhắn thất bại"
                    });
                    setLoadingMessages(roomId, false);
                }
            }
        } catch (error) {
            URL.revokeObjectURL(tempMessage.chatAttachments[0].fileUrl);

            if (roomId) {
                updateMessageByTempId(roomId, {
                    ...tempMessage,
                    isError: true,
                    messageText: "Upload thất bại"
                });
            }

            present({
                message: t("Image upload failed!"),
                duration: 3000,
                color: "danger",
            });
        }
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await handleUploadImageFile(file);
        }
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={handleChange}
            />

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
            >
                <CameraIcon aria-label={t("camera")} />
            </button>
        </>
    );
};

export default SocialChatCameraWeb;