import { useIonToast } from "@ionic/react";
import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import { useImageStore } from "@/store/zustand/image-store";
import { uploadChatFile } from "@/services/file/file-service";
import FlashOnIcon from "@/icons/logo/take-photo/flash_on.svg?react";
import FlashOffIcon from "@/icons/logo/take-photo/flash.svg?react";
import CloseIcon from "@/icons/logo/take-photo/close.svg?react";
import GalleryIcon from "@/icons/logo/take-photo/image.svg?react";
import UploadImgIcon from '@/icons/logo/social-chat/qr-upload-img.svg?react';
import YourQRIcon from '@/icons/logo/social-chat/qr-your-qr-code.svg?react';
import { Capacitor } from "@capacitor/core";
import { AndroidSettings, IOSSettings, NativeSettings } from "capacitor-native-settings";
import { Camera } from "@capacitor/camera";
import { useTranslation } from "react-i18next";
import { BrowserQRCodeReader } from '@zxing/browser';
import { useSocialPartnerStore } from "@/store/zustand/social-partner-store";
import { useCreateFriendshipByCode } from "@/pages/SocialChat/hooks/useSocialQR";
import { useSocialChatStore } from "@/store/zustand/social-chat-store";
const isNative = Capacitor.isNativePlatform();


const SocialQRNative: React.FC = () => {
    const [present, dismiss] = useIonToast();
    const history = useHistory();
    const { t } = useTranslation();

    const [flashOn, setFlashOn] = useState(false);
    const [toastId, setToastId] = useState<string | undefined>(undefined);
    const [permissionDenied, setPermissionDenied] = useState(false);

    const videoRef = useRef<HTMLVideoElement | null>(null);

    const addPendingImages = useImageStore((s) => s.addPendingImages);
    const removePendingImageByUrl = useImageStore((s) => s.removePendingImageByUrl);

    const { mutate: createFriendship, isLoading } = useCreateFriendshipByCode();
    const platform = Capacitor.getPlatform();
    const base64ToFile = (base64: string, filename: string): File => {
        const arr = base64.split(",");
        const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
        const bstr = atob(arr[1]);
        const u8arr = new Uint8Array(bstr.length);
        for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
        return new File([u8arr], filename, { type: mime });
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

    const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

    const handleUploadImageFile = async (file: File) => {
        const localUrl = URL.createObjectURL(file);
        addPendingImages([localUrl]);
        try {
            if (file.size > MAX_IMAGE_SIZE) {
                present({
                    message: t("Photo must be less than 20MB!"),
                    duration: 3000,
                    color: "danger",
                });
                removePendingImageByUrl(localUrl);
                URL.revokeObjectURL(localUrl);
                return;
            }
            const uploaded = await uploadChatFile(file);
            removePendingImageByUrl(localUrl);
            URL.revokeObjectURL(localUrl);
            if (uploaded?.length) {
                addPendingImages([uploaded[0].linkImage]);
                history.goBack();
            }
        } catch {
            removePendingImageByUrl(localUrl);
            URL.revokeObjectURL(localUrl);
            present({
                message: t("Image upload failed!"),
                duration: 3000,
                color: "danger",
            });
        }
    };



    // --- Sử dụng cho chọn từ gallery ---
    const handleChooseFromGallery = async () => {
        let base64Img = "";
        if (base64Img) {
            const file = base64ToFile(base64Img, "gallery.png");
            await handleUploadImageFile(file);
        }
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
            const ok = await checkPermission(); // ✅ await và gán kết quả
            if (!ok) return; // ✅ thoát nếu chưa được cấp quyền

            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
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
    }, [permissionDenied]);





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


    useEffect(() => {
        if (!videoRef.current) return;

        let isActive = true;

        const codeReader = new BrowserQRCodeReader();
        codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
            if (!isActive) return;
            if (result) {
                createFriendship({ toUserCode: result.getText(), inviteMessage: "" });
                // codeReader.reset(); // Nếu muốn stop ngay
            }
        });

        return () => {
        };
    }, []);


    return (
        // <PageContainer>
        <div className="h-full relative  bg-black grid items-center px-6">
            <div className="fixed top-6 left-0 right-0 z-10 p-6 flex items-center justify-between">
                <button onClick={handleToggleFlash}>
                    {flashOn ? <FlashOnIcon aria-label="Flash On" /> : <FlashOffIcon aria-label="Flash Off" />}
                </button>
                <button
                    onClick={() => {
                        stopCamera();
                        history.goBack();
                    }}
                >
                    <CloseIcon aria-label="Đóng" />
                </button>
            </div>
            <div className="flex justify-center items-center w-full h-full xl:max-w-[410px] pb-20">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="rounded-2xl w-full h-auto object-cover "
                    style={{
                        width: "100%",
                        aspectRatio: "1/1",
                        objectFit: "cover",
                        borderRadius: "48px",
                    }}
                />
            </div>
            <div className="fixed bottom-0 left-0 right-0  bg-white  pb-5 pt-3">
                <div className="flex justify-around items-end">
                    <button
                        onClick={handleChooseFromGallery}
                        className="bg-white text-netural-300 gap-[6px] flex flex-col items-center justify-center  text-sm  cursor-pointer font-medium"
                    >
                        <GalleryIcon />
                        <UploadImgIcon className="block" aria-label="Upload Image" />
                        {t("Upload Image")}
                    </button>
                    <button
                        className="bg-white text-netural-300 gap-[6px] flex flex-col items-center justify-center  text-sm  cursor-pointer font-medium"
                        onClick={() => history.push('/social-partner/add')}
                    >
                        <YourQRIcon className="block" />
                        {t("Your QR Code")}
                    </button>
                </div>

            </div>
        </div>
        // </PageContainer>


    );
};

export default SocialQRNative;
