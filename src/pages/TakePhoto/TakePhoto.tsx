import { IonContent, IonPage, useIonToast } from "@ionic/react";
import React, { useEffect, useRef, useState } from "react";
import { QrReader } from "react-qr-reader";
import { Camera } from "@capacitor/camera";
import { usePhotoGallery, base64FromPath } from "./usePhotoGallery";
import { useHistory } from "react-router";
import { useImageStore } from "@/store/zustand/image-store";
import { uploadChatFile } from "@/services/file/file-service";

const TakePhoto: React.FC = () => {
  const { chooseFromGallery } = usePhotoGallery();
  const [present] = useIonToast();
  const history = useHistory();
  const [showQR, setShowQR] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [flashOn, setFlashOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const addPendingImage = useImageStore((s) => s.addPendingImages);

  const handleChooseFromGallery = async () => {
    const imgData = await chooseFromGallery();
    let base64Img = imgData?.base64;
    if (!base64Img && imgData?.webPath) {
      base64Img = await base64FromPath(imgData.webPath);
    }
    if (base64Img) {
      // Convert base64 to File
      const file = base64ToFile(base64Img, "gallery.png");
      const uploaded = await uploadChatFile(file);
      if (uploaded && uploaded.length > 0) {
        addPendingImage([uploaded[0].linkImage]);
        history.push("/chat");
      }
    }
  };

  const checkPermission = async () => {
    const permission = await Camera.checkPermissions();
    if (permission.camera !== "granted") {
      const res = await Camera.requestPermissions({ permissions: ["camera"] });
      if (res.camera === "granted") setShowQR(true);
    } else {
      setShowQR(true);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imgData = canvas.toDataURL("image/png");
      // Convert base64 to File
      const file = base64ToFile(imgData, "captured.png");
      const uploaded = await uploadChatFile(file);
      if (uploaded && uploaded.length > 0) {
        addPendingImage([uploaded[0].linkImage]);
        history.goBack();
      }
    }
  };

  const handleToggleFlash = async () => {
    try {
      const video = videoRef.current;
      if (video?.srcObject) {
        const stream = video.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.();
        if (capabilities && (capabilities as any).torch) {
          setFlashOn((prev) => !prev);
          await track.applyConstraints({
            advanced: [{ torch: !flashOn }] as any,
          });
        } else {
          present({
            message: t("Your device does not support flash!"),
            duration: 2000,
            color: "warning",
          });
        }
      }
    } catch {
      present({
        message: t("Cannot turn flash on/off!"),
        duration: 2000,
        color: "danger",
      });
    }
  };

  useEffect(() => {
    checkPermission();
  }, []);

  useEffect(() => {
    if (showQR) {
      const interval = setInterval(() => {
        const video = document.querySelector(
          "video#qrScanner__video"
        ) as HTMLVideoElement;
        if (video) {
          videoRef.current = video;
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [showQR, facingMode]);

  // Helper function
  function base64ToFile(base64: string, filename: string): File {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  }

  return (
    <IonPage>
      <IonContent>
        <div className="h-full relative w-screen bg-black grid items-center px-6">
          <div className="fixed top-6 left-0 right-0 z-10 p-6  flex items-center justify-between">
            <button onClick={handleToggleFlash}>
              {flashOn ? (
                <img src="logo/take-photo/flash_on.svg" alt={t("Flash On")} />
              ) : (
                <img src="logo/take-photo/flash.svg" alt={t("Flash Off")} />
              )}
            </button>
            <button>
              <img
                src="logo/take-photo/close.svg"
                alt={t("Close")}
                onClick={() => history.goBack()}
              />
            </button>
          </div>

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
              <img src="logo/take-photo/image.svg" alt={t("Gallery")} />
            </button>

            <button onClick={handleCapture}>
              <img
                src="logo/take-photo/button_cam.svg"
                alt={t("Camera")}
                className=""
              />
            </button>
            <button
              onClick={() =>
                setFacingMode(
                  facingMode === "environment" ? "user" : "environment"
                )
              }
              className="rounded-full h-[40px] aspect-square grid justify-center items-center bg-main"
            >
              <img src="logo/take-photo/direction_camera.svg" alt={t("Switch Camera")} />
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TakePhoto;
