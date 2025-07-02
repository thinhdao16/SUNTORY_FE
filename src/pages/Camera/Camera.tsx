import { IonContent, IonPage, useIonToast } from "@ionic/react";
import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import { useImageStore } from "@/store/zustand/image-store";
import { uploadChatFile } from "@/services/file/file-service";
import { base64FromPath, usePhotoGallery } from "../TakePhoto/usePhotoGallery";
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
import PageContainer from "@/components/layout/PageContainer";
const isNative = Capacitor.isNativePlatform();

const CameraPage: React.FC = () => {
    const { chooseFromGallery } = usePhotoGallery();
    const [present, dismiss] = useIonToast();
    const history = useHistory();
    const { t } = useTranslation();

    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
    const [flashOn, setFlashOn] = useState(false);
    const [toastId, setToastId] = useState<string | undefined>(undefined);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);

    const videoRef = useRef<HTMLVideoElement | null>(null);

    const addPendingImages = useImageStore((s) => s.addPendingImages);
    const removePendingImageByUrl = useImageStore((s) => s.removePendingImageByUrl);
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

    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

    const handleUploadImageFile = async (file: File) => {
        const localUrl = URL.createObjectURL(file);
        addPendingImages([localUrl]);
        try {
            if (file.size > MAX_IMAGE_SIZE) {
                present({
                    message: t("Ảnh phải nhỏ hơn 5MB!"),
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

    // --- Sử dụng cho chụp ảnh ---
    const handleCapture = async () => {
        if (isCapturing || !videoRef.current) return;
        setIsCapturing(true);
        try {
            const canvas = document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                const imgData = canvas.toDataURL("image/png");
                const file = base64ToFile(imgData, "captured.png");
                await handleUploadImageFile(file);
            }
        } finally {
            setIsCapturing(false);
        }
    };

    // --- Sử dụng cho chọn từ gallery ---
    const handleChooseFromGallery = async () => {
        const imgData = await chooseFromGallery();
        let base64Img = imgData?.base64 || (imgData?.webPath && await base64FromPath(imgData.webPath));
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

    useEffect(() => {
        if (permissionDenied) return;
        let stream: MediaStream | null = null;

        const init = async () => {
            checkPermission()
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
    }, [facingMode, permissionDenied]);




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

        // <PageContainer>

        <div className="h-full relative  bg-black grid items-center px-6">
            {/* Top bar */}
            <div className="fixed top-6 left-0 right-0 z-10 p-6 flex items-center justify-between">
                <button onClick={handleToggleFlash}>
                    {flashOn ? <FlashOnIcon aria-label="Flash On" /> : <FlashOffIcon aria-label="Flash Off" />}
                </button>
                <button onClick={() => history.goBack()}>
                    <CloseIcon aria-label="Đóng" />
                </button>
            </div>
            {/* Camera preview */}
            <div className="flex justify-center items-center w-full h-full xl:max-w-[410px]">
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
            {/* Bottom bar */}
            <div className="fixed bottom-6 left-0 right-0 p-6 z-10 flex justify-between items-center">
                <button
                    onClick={handleChooseFromGallery}
                    className="rounded-full h-[40px] aspect-square grid justify-center items-center bg-main"
                >
                    <GalleryIcon aria-label="Gallery" />
                </button>
                <button onClick={handleCapture} disabled={isCapturing}>
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
                    className="rounded-full h-[40px] aspect-square grid justify-center items-center bg-main"
                >
                    <SwitchCameraIcon aria-label="Đổi camera" />
                </button>
            </div>
        </div>
        // </PageContainer>


    );
};

export default CameraPage;
