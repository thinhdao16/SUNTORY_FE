import React from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { openSidebarWithAuthCheck } from '@/store/zustand/ui-store';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserStatsCard } from './UserStatsCard';
import { useLanguageSwitcher } from '../hooks/useLanguageSwitcher';
import { useUserStats } from '../hooks/useUserStats';

import NavBarHomeIcon from "@/icons/logo/nav_bar_home.svg?react";
import VectorRightIcon from "@/icons/logo/vector_right.svg?react";
import PendingImages from '@/pages/ChatStream/components/PendingImages';
import PendingFiles from '@/pages/ChatStream/components/PendingFiles';
import { Capacitor } from '@capacitor/core';
import { useImageStore } from '@/store/zustand/image-store';
import { useUploadChatFile } from '@/hooks/common/useUploadChatFile';
import { useUploadStore } from '@/store/zustand/upload-store';
import { useChatStreamMessages } from '@/pages/ChatStream/hooks/useChatStreamMessages';

import CameraIcon from "@/icons/logo/chat/cam.svg?react";
import ImageIcon from "@/icons/logo/chat/image.svg?react";
import SendIcon from "@/icons/logo/chat/send.svg?react";
import CameraWeb from "@/pages/Camera/CameraWeb";
import { useToastStore } from '@/store/zustand/toast-store';
import { useChatStore } from '@/store/zustand/chat-store';
import dayjs from "dayjs";
import { generatePreciseTimestampFromDate } from '@/utils/time-stamp';
import i18n from '@/config/i18n';
import { createChatApi } from '@/services/chat/chat-service';
import { useQueryClient } from 'react-query';

import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

interface HomeHeaderProps {
    userInfo: any;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const HomeHeader: React.FC<HomeHeaderProps> = ({ userInfo }) => {
    const messageRef = useRef<any>(null);
    const messagesEndRef = useRef<any>(null);
    const messagesContainerRef = useRef<any>(null);

    const history = useHistory();
    const { t } = useTranslation();
    const languageSwitcher = useLanguageSwitcher();
    const { age, height, weight, bmi } = useUserStats(userInfo);
    const isNative = Capacitor.isNativePlatform();
    const isDesktop = typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
    const uploadImageMutation = useUploadChatFile();
    const imageLoading = useUploadStore.getState().imageLoading;
    const queryClient = useQueryClient();
    const setPendingMessages = useChatStore((s) => s.setPendingMessages);

    const {
        messageValue,
        setMessageValue
    } = useChatStreamMessages(messageRef, messagesEndRef, messagesContainerRef, "", false, true);
    const {
        pendingImages, pendingFiles,
        addPendingImages,
        removePendingImage, removePendingFile, removePendingImageByUrl } = useImageStore();

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
    const handleSendMessage = async (e: React.KeyboardEvent | React.MouseEvent,) => {
        e.preventDefault();
        useChatStore.getState().setStopMessages(false);
        const setSession = useChatStore.getState().setSession;
        setSession("50");
        const sessionCreatedAt = useChatStore.getState().sessionCreatedAt;
        const sessionIdAtSend = sessionCreatedAt;
        if (messageValue.trim() || pendingImages.length > 0 || pendingFiles.length > 0) {
            setMessageValue("");

            // addPendingImages([]);
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
                    chatCode: null,
                    messageText: messageValue.trim(),
                    topic: Number(50),
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

                const tempId = `temp_${Date.now()}`;

                setPendingMessages((prev: any) => [
                    ...prev,
                    {
                        id: tempId,
                        text: messageValue.trim(),
                        createdAt: now.format("YYYY-MM-DDTHH:mm:ss.SSS"),
                        timeStamp: generatePreciseTimestampFromDate(now.toDate()),
                        attachments: attachments.length > 0 ? attachments : undefined,
                        files: attachments.length > 0 ? attachments.map(a => ({ name: a.fileName })) : undefined,
                        messageState: "SENDING",
                        isRight: true,
                    }
                ]);
                history.push(`/chat/50`);

                let res: any
                res = await createChatApi(payload);

                if (timeoutId) clearTimeout(timeoutId);

                if (res?.data?.userChatMessage) {
                    setPendingMessages((prev: any[]) => {
                        return prev.map(msg => {
                            if (msg.id === tempId) {
                                const serverMsg = res.data.userChatMessage;
                                return {
                                    ...msg,
                                    id: serverMsg.id,
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
                                    messageState: "SENT",
                                    hasAttachment: serverMsg.hasAttachment,
                                    isRead: serverMsg.isRead,
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
                    const newSessionId = res.data.userChatMessage.chatInfo.code;
                    queryClient.refetchQueries(["chatHistory"]);
                    history.replace(`/chat/${50}/${newSessionId}`);
                    // setHasFirstSignalRMessage(true);
                    // setStopMessages(false);
                }
            } catch (err) {
                if (timeoutId) clearTimeout(timeoutId);
                const sessionCreatedAt = useChatStore.getState().sessionCreatedAt;
                if (sessionIdAtSend !== sessionCreatedAt) return;

                useChatStore.getState().setIsSending(false);

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
    return (
        <div className="relative rounded-b-3xl overflow-hidden px-4 pt-4 h-[318px]">
            <div
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                    backgroundImage: 'url("background/background_radi_home_header.svg")',
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />
            <div className="relative z-10">
                <div className="flex items-center justify-between">
                    <button onClick={() => openSidebarWithAuthCheck()}>
                        <NavBarHomeIcon />
                    </button>

                    <LanguageSwitcher {...languageSwitcher} userLanguageCode={userInfo?.language?.code} isFeeching={true} />
                </div>

                <div className="flex justify-between items-end">
                    <div className="flex items-start gap-2 mt-6">
                        {userInfo?.id ? (
                            <div className="text-white text-2xl font-semibold truncate max-w-[250px] min-w-0">
                                {t("Hi,")} {userInfo?.lastname || userInfo?.email || t("Guest")}
                            </div>
                        ) : (
                            <div className="text-white text-2xl font-semibold truncate min-w-0">
                                {t("Welcome")}
                            </div>
                        )}
                    </div>

                    {userInfo?.id ? (
                        <a
                            className="flex items-center gap-2 border border-white rounded-full text-white text-sm font-medium bg-gradient-to-b from-main to-primary-600 px-3 py-1 whitespace-nowrap"
                            onClick={() => history.push("/profile/")}
                            style={{ cursor: "pointer" }}
                        >
                            <span>{t("Update Profile")}</span>
                            <span className="bg-white rounded-full flex items-center justify-center h-[13px] w-[13px]">
                                <VectorRightIcon className="w-[8px]" />
                            </span>
                        </a>
                    ) : (
                        <a
                            className="flex items-center gap-2 border border-white rounded-full text-white text-sm font-medium bg-gradient-to-b from-main to-primary-600 px-3 py-1 whitespace-nowrap max-w-[100px] overflow-hidden text-ellipsis"
                            onClick={() => history.push("/login")}
                            style={{ cursor: "pointer" }}
                        >
                            <span className="overflow-hidden text-ellipsis whitespace-nowrap block">{t("Login")}</span>
                        </a>
                    )}
                </div>

                <UserStatsCard bmi={bmi} age={age} height={height} weight={weight} />
                {/* <div className="w-full mx-auto bg-white rounded-2xl shadow-[0px_2px_4px_2px_#0000001A] px-6 py-4 flex flex-col gap-2">
                    <div className="flex gap-2 flex-wrap">
                        <PendingImages
                            pendingImages={pendingImages}
                            imageLoading={uploadImageMutation.isLoading}
                            removePendingImage={removePendingImage}
                            imageLoadingMany={!!imageLoading}
                        />
                        <PendingFiles
                            pendingFiles={pendingFiles}
                            removePendingFile={removePendingFile}
                        />
                    </div>
                    <textarea
                        placeholder={t("Enter your message...")}
                        value={messageValue}
                        ref={messageRef}
                        onChange={(e) => setMessageValue(e.target.value)}
                        className="focus:outline-none resize-none max-h-[230px] overflow-y-auto"
                        rows={1}
                        onFocus={() => {
                            setTimeout(() => {
                                window.dispatchEvent(new Event("resize"));
                            }, 200);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                        onPaste={async (e) => {
                            const items = e.clipboardData?.items;
                            if (!items) return;
                            for (const item of items) {
                                if (item.type.startsWith("image/")) {
                                    const file = item.getAsFile();
                                    if (file) {
                                        await uploadImageMutation.mutateAsync(file, {
                                            onSuccess: (uploaded: any) => {
                                                if (uploaded && uploaded.length > 0) {
                                                    addPendingImages([uploaded[0].linkImage]);
                                                }
                                            },
                                        });
                                    }
                                }
                            }
                        }}
                    />
                    <div className="flex justify-between items-center">
                        <div className="flex gap-6">
                            {(isNative || isDesktop) ? (
                                <button onClick={() => history.push("/camera")}>
                                    <CameraIcon aria-label={t("camera")} />
                                </button>
                            ) : (
                                <CameraWeb />
                            )}
                            <label>
                                <ImageIcon aria-label={t("image")} />
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </label>
                        </div>
                      
                        <button
                            type="button"
                            onClick={(e) => handleSendMessage(e)}
                        >
                            <SendIcon aria-label={t("send")} />
                        </button>
                    </div>
                </div> */}
            </div>
        </div>
    );
};
