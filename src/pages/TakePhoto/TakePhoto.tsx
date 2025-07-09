import { IonContent, IonPage, useIonToast } from "@ionic/react";
import React, { useEffect, useRef, useState } from "react";
import { QrReader } from "react-qr-reader";
import { Camera } from "@capacitor/camera";
import { usePhotoGallery, base64FromPath } from "./usePhotoGallery";
import { useHistory } from "react-router";
import { useImageStore } from "@/store/zustand/image-store";
import { uploadChatFile } from "@/services/file/file-service";
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';
import { Capacitor } from "@capacitor/core";
import FlashOnIcon from "@/icons/logo/take-photo/flash_on.svg?react";
import FlashOffIcon from "@/icons/logo/take-photo/flash.svg?react";
import CloseIcon from "@/icons/logo/take-photo/close.svg?react";
import GalleryIcon from "@/icons/logo/take-photo/image.svg?react";
import CaptureIcon from "@/icons/logo/take-photo/button_cam.svg?react";
import SwitchCameraIcon from "@/icons/logo/take-photo/direction_camera.svg?react";

const isNative = Capacitor.isNativePlatform();
const TakePhoto: React.FC = () => {
  const { chooseFromGallery } = usePhotoGallery();
  const [present] = useIonToast();
  const history = useHistory();
  const [showQR, setShowQR] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [flashOn, setFlashOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);

  const addPendingImage = useImageStore((s) => s.addPendingImages);

  const openDeviceSettings = async () => {
    const platform = Capacitor.getPlatform();
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
      console.error("Failed to open device settings:", error);
      present({
        message: t("Cannot open device settings on this platform."),
        duration: 3000,
        color: "danger",
      });
    }
  };

  const checkPermission = async () => {
    if (window.isSecureContext && navigator.mediaDevices?.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setShowQR(true);
      } catch {
        present({
          message: "Please allow camera access in your browser settings.",
          duration: 0,
          color: "danger",
          buttons: [
            {
              text: "Open Settings",
              handler: () => openDeviceSettings(),
            },
            {
              text: "Close",
              role: "cancel",
            },
          ],
        });
      }
    } else {
      const permission = await Camera.checkPermissions();
      if (permission.camera !== "granted") {
        const res = await Camera.requestPermissions({ permissions: ["camera"] });
        if (res.camera === "granted") {
          setShowQR(true);
        } else if (res.camera === "denied") {
          present({
            message: "Camera access denied. Please allow it in system settings.",
            duration: 0,
            color: "danger",
            buttons: [
              {
                text: "Open Settings",
                handler: () => openDeviceSettings(),
              },
              {
                text: "Close",
                role: "cancel",
              },
            ],
          });
        }
      } else {
        setShowQR(true);
      }
    }
  };

  const handleChooseFromGallery = async () => {
    const imgData = await chooseFromGallery();
    let base64Img = imgData?.base64 || (imgData?.webPath && await base64FromPath(imgData.webPath));
    if (base64Img) {
      const file = base64ToFile(base64Img, "gallery.png");
      const uploaded = await uploadChatFile(file);
      if (uploaded?.length) {
        addPendingImage([uploaded[0].linkImage]);
        history.goBack();
      }
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imgData = canvas.toDataURL("image/png");
      const file = base64ToFile(imgData, "captured.png");
      const uploaded = await uploadChatFile(file);
      if (uploaded?.length) {
        addPendingImage([uploaded[0].linkImage]);
        history.goBack();
      }
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
        present({ message: "Your device does not support flash!", duration: 2000, color: "warning" });
      }
    } catch {
      present({ message: "Failed to toggle flash!", duration: 2000, color: "danger" });
    }
  };

  useEffect(() => {
    checkPermission();
  }, []);

  useEffect(() => {
    if (showQR) {
      const interval = setInterval(() => {
        const video = document.querySelector("video#qrScanner__video") as HTMLVideoElement;
        if (video) {
          videoRef.current = video;
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [showQR, facingMode]);
  useEffect(() => {
    if (!isNative) return;
    let CameraPreview: any;
    let started = false;
    (async () => {
      const mod = await import("@capacitor-community/camera-preview");
      CameraPreview = mod.CameraPreview;
      await CameraPreview.start({
        parent: "cameraPreview",
        className: "cameraPreview",
        position: facingMode === "user" ? "front" : "rear",
        width: window.innerWidth,
        height: window.innerHeight,
        toBack: false,
      });
      started = true;
      setCameraStarted(true);
    })();
    return () => {
      if (CameraPreview && started) CameraPreview.stop();
    };
    // eslint-disable-next-line
  }, [facingMode]);
  useEffect(() => {
    return () => {
      // Ngắt camera khi rời trang (web)
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      // Ngắt camera preview native nếu có
      if (isNative) {
        import("@capacitor-community/camera-preview").then(mod => {
          mod.CameraPreview.stop();
        });
      }
    };
    // eslint-disable-next-line
  }, []);

  const base64ToFile = (base64: string, filename: string): File => {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    return new File([u8arr], filename, { type: mime });
  };
  const handleNativeCapture = async () => {
    const { CameraPreview } = await import("@capacitor-community/camera-preview");
    const result = await CameraPreview.capture({ quality: 90 });
    const base64Img = "data:image/jpeg;base64," + result.value;
    const file = base64ToFile(base64Img, "captured.jpg");
    const uploaded = await uploadChatFile(file);
    if (uploaded?.length) {
      addPendingImage([uploaded[0].linkImage]);
      history.goBack();
    }
  };
  return (
    <IonPage>
      <IonContent>
        <div className="h-full relative w-screen bg-black grid items-center px-6">
          <div className="fixed top-6 left-0 right-0 z-10 p-6  flex items-center justify-between">
            <button onClick={handleToggleFlash}>
              {flashOn ? (
                <FlashOnIcon aria-label={t("Flash On")} />
              ) : (
                <FlashOffIcon aria-label={t("Flash Off")} />
              )}
            </button>
            <button onClick={() => history.goBack()}>
              <CloseIcon aria-label={t("Close")} />
            </button>
          </div>
          {/* {isNative && (
            <div id="cameraPreview" className="absolute inset-0 z-0" />
          )} */}
          {showQR && (
            <QrReader
              key={facingMode}
              videoId="qrScanner__video"
              constraints={{ facingMode }}
              onResult={() => { }}
              videoStyle={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "48px",
                transform: facingMode === "user" ? "scaleX(-1)" : "none",
              }}
            />
          )}

          <div className="fixed bottom-6 left-0 right-0 p-6  z-10 flex justify-between items-center">
            <button
              onClick={handleChooseFromGallery}
              className="rounded-full h-[40px] aspect-square grid justify-center items-center bg-main"
            >
              <GalleryIcon aria-label={t("Gallery")} />
            </button>

            {/* {isNative ? (
              <button onClick={handleNativeCapture}>
                <CaptureIcon aria-label={t("Camera")} />
              </button>
            ) : ( */}
            <button onClick={handleCapture}>
              <CaptureIcon aria-label={t("Camera")} />
            </button>
            {/* )} */}
            <button
              onClick={() =>
                setFacingMode(
                  facingMode === "environment" ? "user" : "environment"
                )
              }
              className="rounded-full h-[40px] aspect-square grid justify-center items-center bg-main"
            >
              <SwitchCameraIcon aria-label={t("Switch Camera")} />
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TakePhoto;
