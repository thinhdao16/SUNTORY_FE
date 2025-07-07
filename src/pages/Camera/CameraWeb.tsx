import { uploadChatFile } from "@/services/file/file-service";
import { useImageStore } from "@/store/zustand/image-store";
import { Capacitor } from "@capacitor/core";
import { useIonToast } from "@ionic/react";
import { AndroidSettings, IOSSettings, NativeSettings } from "capacitor-native-settings";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router";
import CameraIcon from "@/icons/logo/chat/cam.svg?react";

const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

const CameraWeb: React.FC = () => {
    const inputRef = useRef<HTMLInputElement>(null);
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
                // history.goBack();
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
    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
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

    // const checkPermission = async (): Promise<boolean> => {
    //     const id = `camera-toast-${Date.now()}`;
    //     setToastId(id);

    //     if (platform === "web") {
    //         if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    //             console.warn("Browser does not support getUserMedia or not secure context.");
    //             return false;
    //         }

    //         try {
    //             await navigator.mediaDevices.getUserMedia({ video: true });
    //             return true;
    //         } catch (err) {
    //             present({
    //                 id,
    //                 message: t("Please allow camera access in your browser settings."),
    //                 duration: 0,
    //                 color: "danger",
    //                 buttons: [
    //                     {
    //                         text: t("Open Settings"),
    //                         handler: () => openDeviceSettings(),
    //                     },
    //                     { text: t("Close"), role: "cancel" },
    //                 ],
    //             });
    //             return false;
    //         }
    //     }
    //     try {
    //         const permission = await Camera.checkPermissions();
    //         if (permission.camera !== "granted") {
    //             const res = await Camera.requestPermissions({ permissions: ["camera"] });
    //             if (res.camera === "denied") {
    //                 setPermissionDenied(true);
    //                 present({
    //                     id,
    //                     message: t("Camera access denied. Please allow it in system settings."),
    //                     duration: 0,
    //                     color: "danger",
    //                     buttons: [
    //                         {
    //                             text: t("Open Settings"),
    //                             handler: () => openDeviceSettings(),
    //                         },
    //                         { text: t("Close"), role: "cancel" },
    //                     ],
    //                 });
    //                 return false;
    //             }
    //         }
    //         return true;
    //     } catch (err: any) {
    //         setPermissionDenied(true);
    //         present({
    //             message: t("Error during native camera check."),
    //             duration: 3000,
    //             color: "danger",
    //         });
    //         return false;
    //     }


    // };

    // useEffect(() => {
    //     if (permissionDenied) return;
    //     let stream: MediaStream | null = null;

    //     const init = async () => {
    //         checkPermission()
    //         try {
    //             const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
    //             stream = mediaStream;
    //             if (videoRef.current) {
    //                 videoRef.current.srcObject = mediaStream;
    //             }
    //         } catch (err) {
    //             console.error("❌ Failed to start camera after permission:", err);
    //         }
    //     };
    //     init();
    //     return () => {
    //         if (stream) stream.getTracks().forEach(track => track.stop());
    //     };
    // }, [facingMode, permissionDenied]);




    // useEffect(() => {
    //     return () => {
    //         if (videoRef.current && videoRef.current.srcObject) {
    //             const stream = videoRef.current.srcObject as MediaStream;
    //             stream.getTracks().forEach(track => track.stop());
    //             videoRef.current.srcObject = null;
    //         }

    //     };
    // }, []);
    // useEffect(() => {
    //     return () => {
    //         if (toastId) dismiss();
    //         if (videoRef.current && videoRef.current.srcObject) {
    //             const stream = videoRef.current.srcObject as MediaStream;
    //             stream.getTracks().forEach((track) => track.stop());
    //             videoRef.current.srcObject = null;
    //         }
    //     };
    // }, [toastId]);
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

export default CameraWeb;