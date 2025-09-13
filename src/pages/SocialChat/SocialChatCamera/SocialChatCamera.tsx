import { IonContent, IonPage, useIonToast } from "@ionic/react";
import React, { useEffect, useRef, useState } from "react";
import { useHistory, useParams } from "react-router";
import { uploadChatFile } from "@/services/file/file-service";
import { base64FromPath, usePhotoGallery } from "../../TakePhoto/usePhotoGallery";
import { useSocialChatStore } from "@/store/zustand/social-chat-store";
import { useToastStore } from "@/store/zustand/toast-store";
import { useSendSocialChatMessage } from "@/pages/SocialChat/hooks/useSocialChat";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";
import { generatePreciseTimestampFromDate } from "@/utils/time-stamp";
import { ChatMessage } from "@/types/social-chat";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import FlashOnIcon from "@/icons/logo/take-photo/flash_on.svg?react";
import FlashOffIcon from "@/icons/logo/take-photo/flash.svg?react";
import CloseIcon from "@/icons/logo/take-photo/close.svg?react";
import GalleryIcon from "@/icons/logo/take-photo/image.svg?react";
import CaptureIcon from "@/icons/logo/take-photo/button_cam.svg?react";
import SwitchCameraIcon from "@/icons/logo/take-photo/direction_camera.svg?react";
import { Capacitor } from "@capacitor/core";
import { AndroidSettings, IOSSettings, NativeSettings } from "capacitor-native-settings";
import { Camera } from "@capacitor/camera";
import { useTranslation } from "react-i18next";

dayjs.extend(utc);

const isNative = Capacitor.isNativePlatform();
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

const SocialChatCamera: React.FC = () => {
    const { chooseFromGallery } = usePhotoGallery();
    const [present, dismiss] = useIonToast();
    const history = useHistory();
    const { t } = useTranslation();
    const roomId = localStorage.getItem("roomId") || useParams<{ roomId?: string }>().roomId;

    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
    const [flashOn, setFlashOn] = useState(false);
    const [toastId, setToastId] = useState<string | undefined>(undefined);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [capturedFile, setCapturedFile] = useState<File | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const platform = Capacitor.getPlatform();

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
    const base64ToFile = (base64: string, filename: string): File => {
        const arr = base64.split(",");
        const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
        const bstr = atob(arr[1]);
        const u8arr = new Uint8Array(bstr.length);
        for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
        return new File([u8arr], filename, { type: mime });
    };

    const handleUploadImageFile = async (file: File) => {
        if (isUploading) return;
        setIsUploading(true);

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
                    message: t("Photo must be less than 20MB!"),
                    duration: 3000,
                    color: "danger",
                });

                if (roomId) {
                    updateMessageByTempId(roomId, {
                        ...tempMessage,
                        isError: true,
                        messageText: "Ảnh quá lớn (>20MB)"
                    });
                }

                URL.revokeObjectURL(tempMessage.chatAttachments[0].fileUrl);
                return;
            }

            const uploaded = await uploadChatFile(file);
            // Clean up local URL after upload
            URL.revokeObjectURL(tempMessage.chatAttachments[0].fileUrl);

            if (uploaded?.length && roomId) {
                const uploadedFile = uploaded[0];

                // updateMessageByTempId(roomId, {
                //     ...tempMessage,
                //     chatAttachments: [{
                //         id: Date.now(),
                //         chatMessageId: 0,
                //         fileUrl: uploadedFile.linkImage,
                //         fileName: uploadedFile.name,
                //         fileType: 1,
                //         fileSize: file.size,
                //         createDate: dayjs.utc().format("YYYY-MM-DDTHH:mm:ss.SSS"),
                //     }],
                //     attachments: [],
                //     isSend: false,
                //     isError: false
                // });

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
                            chatAttachments: serverMsg.chatAttachments?.length > 0 ?
                                serverMsg.chatAttachments.map((att: any) => ({
                                    id: att.id,
                                    chatMessageId: att.chatMessageId,
                                    fileUrl: att.fileUrl,
                                    fileName: att.fileName,
                                    fileType: att.fileType,
                                    fileSize: att.fileSize,
                                    createDate: att.createDate,
                                })) : tempMessage.chatAttachments,
                        });
                        if (serverMsg.userHasRead && serverMsg.userHasRead.length > 0) {
                            updateOldMessagesWithReadStatus(
                                roomId, 
                                serverMsg.userHasRead, 
                                tempMessage.userId
                            );
                        }
                        history.goBack();
                    }

                } catch (error) {
                    console.error('Send message failed:', error);
                    updateMessageByTempId(roomId, {
                        ...tempMessage,
                        isError: true,
                        messageText: "Gửi tin nhắn thất bại"
                    });
                    showToast("Gửi tin nhắn thất bại", 3000, "error");
                } finally {
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
        } finally {
            setIsUploading(false);
        }
    };

    const handleToggleFlash = async () => {
        try {
            const video = videoRef.current;
            const stream = video?.srcObject as MediaStream;
            const track = stream?.getVideoTracks?.()[0];
            const capabilities = track?.getCapabilities?.();
            if ((capabilities as any)?.torch) {
                setFlashOn((prev) => !prev);
                await track.applyConstraints({ advanced: [{ torch: !flashOn }] as any });
            } else {
                present({ message: t("Device does not support flash!"), duration: 2000, color: "warning" });
            }
        } catch {
            present({ message: t("Failed to toggle flash!"), duration: 2000, color: "danger" });
        }
    };

const handleCapture = async () => {
    if (isCapturing || !videoRef.current || isUploading) return;

    const hasPermission = await checkPermission();
    if (!hasPermission) {
        present({
            message: t("You have not granted permission to use the camera. Please allow permission to take photos."),
            duration: 3000,
            color: "danger",
        });
        return;
    }

    setIsCapturing(true);
    try {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            const imgData = canvas.toDataURL("image/png");
            const file = base64ToFile(imgData, `captured_${Date.now()}.png`);

            setCapturedImage(imgData);
            setCapturedFile(file);
            setShowPreview(true);
        }
    } finally {
        setIsCapturing(false);
    }
};


    const handleChooseFromGallery = async () => {
        if (isUploading) return;

        const imgData = await chooseFromGallery();
        let base64Img = imgData?.base64 || (imgData?.webPath && await base64FromPath(imgData.webPath));
        if (base64Img) {
            const file = base64ToFile(base64Img, `gallery_${Date.now()}.png`);

            setCapturedImage(base64Img);
            setCapturedFile(file);
        }
    };

    const handleSendImage = async () => {
        if (capturedFile) {
            await handleUploadImageFile(capturedFile);
            setCapturedImage(null);
            setCapturedFile(null);
        }
    };

    const handleRetake = () => {
        setShowPreview(false);
        setTimeout(() => {
            setCapturedImage(null);
            setCapturedFile(null);
        }, 300); 
    };

    const openDeviceSettings = async () => {
        if (platform === "web") {
            present({
                message: t("Please open your browser settings and allow camera permission for this site."),
                duration: 4000,
                color: "warning",
            });
            return;
        }
        try {
            if (platform === "android") {
                await NativeSettings.openAndroid({ option: AndroidSettings.ApplicationDetails });
            } else if (platform === "ios") {
                await NativeSettings.openIOS({ option: IOSSettings.App });
            }
        } catch (error) {
            present({
                message: t("Cannot open device settings on this platform."),
                duration: 3000,
                color: "danger",
            });
        }
    };

    const checkPermission = async (): Promise<boolean> => {
        const id = `camera-toast-${Date.now()}`;
        setToastId(id);

        if (platform === "web") {
            if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
                console.warn("Browser does not support getUserMedia or not secure context.");
                return false;
            }

            try {
                await navigator.mediaDevices.getUserMedia({ video: true });
                return true;
            } catch (err) {
                present({
                    id,
                    message: t("Please allow camera access in your browser settings."),
                    duration: 0,
                    color: "danger",
                    buttons: [
                        {
                            text: t("Open Settings"),
                            handler: () => openDeviceSettings(),
                        },
                        { text: t("Close"), role: "cancel" },
                    ],
                });
                return false;
            }
        }
        try {
            const permission = await Camera.checkPermissions();
            if (permission.camera !== "granted") {
                const res = await Camera.requestPermissions({ permissions: ["camera"] });
                if (res.camera === "denied") {
                    setPermissionDenied(true);
                    present({
                        id,
                        message: t("Camera access denied. Please allow it in system settings."),
                        duration: 0,
                        color: "danger",
                        buttons: [
                            {
                                text: t("Open Settings"),
                                handler: () => openDeviceSettings(),
                            },
                            { text: t("Close"), role: "cancel" },
                        ],
                    });
                    return false;
                }
            }
            return true;
        } catch (err: any) {
            setPermissionDenied(true);
            present({
                message: t("Error during native camera check."),
                duration: 3000,
                color: "danger",
            });
            return false;
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    useEffect(() => {
        if (permissionDenied) return;
        let stream: MediaStream | null = null;

        const init = async () => {
            const ok = await checkPermission();
            if (!ok) return;

            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
                stream = mediaStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("❌ Failed to start camera after permission:", err);
            }
        };
        init();

        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, [facingMode, permissionDenied, capturedImage]);

    useEffect(() => {
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
            if (isNative) {
                import("@capacitor-community/camera-preview").then(mod => {
                    mod.CameraPreview.stop();
                });
            }
        };
    }, []);

    useEffect(() => {
        return () => {
            if (toastId) dismiss();
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach((track) => track.stop());
                videoRef.current.srcObject = null;
            }
        };
    }, [toastId]);

    return (
        <div className="h-full relative bg-black grid items-center px-6">
            <div className="fixed top-6 left-0 right-0 z-10 p-6 flex items-center justify-between">
                {!capturedImage && (
                    <button onClick={handleToggleFlash} disabled={isUploading}>
                        {flashOn ? <FlashOnIcon aria-label="Flash On" /> : <FlashOffIcon aria-label="Flash Off" />}
                    </button>
                )}
                <button
                    onClick={() => {
                        if (capturedImage) {
                            handleRetake();
                        } else {
                            stopCamera();
                            history.goBack();
                        }
                    }}
                    disabled={isUploading}
                >
                    <CloseIcon aria-label={capturedImage ? "Hủy" : "Đóng"} />
                </button>
            </div>

            <div className="flex justify-center items-center w-full h-full xl:max-w-[410px]">
                {capturedImage ? (
                    <div className="relative w-full">
                        <img
                            src={capturedImage}
                            alt="Captured"
                            className="rounded-2xl w-full h-auto object-cover"
                            style={{
                                width: "100%",
                                aspectRatio: "1/1",
                                objectFit: "cover",
                                borderRadius: "48px",
                            }}
                        />

                        {isUploading && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
                                <div className="text-center text-white">
                                    <div className="loader border-4 border-white border-t-transparent rounded-full w-12 h-12 animate-spin mx-auto mb-4"></div>
                                    <p>{t("Uploading...")}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="rounded-2xl w-full h-auto object-cover"
                            style={{
                                width: "100%",
                                aspectRatio: "1/1",
                                objectFit: "cover",
                                borderRadius: "48px",
                            }}
                        />
                    </>
                )}
            </div>

            <div className="fixed bottom-6 left-0 right-0 p-6 z-10 flex justify-between items-center">
                {capturedImage ? (
                    <div className="flex gap-4 w-full max-w-sm mx-auto">
                        <button
                            onClick={handleRetake}
                            disabled={isUploading}
                            className="flex-1 h-12 rounded-full bg-white/20 text-white font-medium disabled:opacity-50 transition-all active:scale-95"
                        >
                            {t("Chụp lại")}
                        </button>

                        <button
                            onClick={handleSendImage}
                            disabled={isUploading}
                            className="flex-1 h-12 rounded-full bg-blue-500 text-white font-medium disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {t("Đang gửi...")}
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    {t("Gửi")}
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={handleChooseFromGallery}
                            disabled={isUploading}
                            className="rounded-full h-[40px] aspect-square grid justify-center items-center bg-main disabled:opacity-50"
                        >
                            <GalleryIcon aria-label="Gallery" />
                        </button>

                        <button
                            onClick={handleCapture}
                            disabled={isCapturing || isUploading}
                            className="disabled:opacity-50"
                        >
                            {isCapturing ? (
                                <div className="w-12 h-12 flex items-center justify-center">
                                    <div className="loader border-4 border-white border-t-main rounded-full w-10 h-10 animate-spin"></div>
                                </div>
                            ) : (
                                <CaptureIcon aria-label="Chụp ảnh" />
                            )}
                        </button>

                        <button
                            onClick={() =>
                                setFacingMode(
                                    facingMode === "environment" ? "user" : "environment"
                                )
                            }
                            disabled={isUploading}
                            className="rounded-full h-[40px] aspect-square grid justify-center items-center bg-main disabled:opacity-50"
                        >
                            <SwitchCameraIcon aria-label="Đổi camera" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default SocialChatCamera;
