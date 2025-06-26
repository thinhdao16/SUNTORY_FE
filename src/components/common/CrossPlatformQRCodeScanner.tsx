/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { CameraPreview } from "capacitor-plugin-camera";
import { Html5Qrcode } from "html5-qrcode";
import { useHistory } from "react-router";

interface Props {
  torchOn?: boolean;
  onPlayed?: (meta: { orientation: string; resolution: string }) => void;
}

const CrossPlatformQRCodeScanner: React.FC<Props> = ({
  torchOn,
  onPlayed,
}) => {
  const isNative = Capacitor.isNativePlatform();
  const containerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [initialized, setInitialized] = useState(false);
  const qrRegionId = "html5qr-code-full-region";
  const history = useHistory()
  const isStarting = useRef(false);
  const isRunning = useRef(false);

  const setupHtml5Qrcode = async () => {
    if (isStarting.current || isRunning.current) return;
    isStarting.current = true;

    try {
      const qrCodeScanner = new Html5Qrcode(qrRegionId);
      const width = window.innerWidth
      const height = window.innerHeight
      const aspectRatio = width / height
      const reverseAspectRatio = height / width

      const mobileAspectRatio = reverseAspectRatio > 1.5
        ? reverseAspectRatio + (reverseAspectRatio * 12 / 100)
        : reverseAspectRatio
      html5QrCodeRef.current = qrCodeScanner;


      await qrCodeScanner.start(
        { facingMode: "environment" },
        {
          fps: 20,
          qrbox: { width: 250, height: 250 },
          videoConstraints: {
            facingMode: 'environment',
            aspectRatio: width < 600
              ? mobileAspectRatio
              : aspectRatio,
          },
        },
        (decodedText) => {
          try {
            const url = new URL(decodedText);
            history.push(url.pathname)
          } catch (err) {
            console.error("Invalid URL:", decodedText);
          }
        },
        (errorMessage) => {
          // console.warn("QR Code scan error:", errorMessage);
        }
      );

      isRunning.current = true;
    } catch (err) {
      console.error("html5-qrcode start failed:", err);
    } finally {
      isStarting.current = false;
    }
  };

  // Native camera preview
  const setupNative = async () => {
    if (containerRef.current) {
      await CameraPreview.setElement(containerRef.current);
    }

    await CameraPreview.initialize();
    await CameraPreview.requestCameraPermission();
    await CameraPreview.startCamera();

    const orientation = (await CameraPreview.getOrientation()).orientation;
    const resolution = (await CameraPreview.getResolution()).resolution;
    onPlayed?.({ orientation, resolution });
  };

  // Init
  useEffect(() => {
    const init = async () => {
      try {
        if (isNative) {
          await setupNative();
        } else {
          await setupHtml5Qrcode();
        }
        setInitialized(true);
      } catch (err) {
        console.error("Init scanner failed:", err);
      }
    };
    init();

    return () => {
      if (isNative) {
        CameraPreview.stopCamera();
      } else if (html5QrCodeRef.current && isRunning.current) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            html5QrCodeRef.current?.clear();
            isRunning.current = false;
          })
          .catch((err) => {
            console.warn("html5-qrcode stop failed:", err);
          });
      }
    };
  }, []);

  // useEffect(() => {
  //   if (initialized && isNative) {
  //     CameraPreview.toggleTorch({ on: torchOn === true });
  //   }
  // }, [torchOn, initialized]);

  return (
    <div ref={containerRef}  >
      {!isNative && <div id="html5qr-code-full-region" />}
    </div>
  );
};

export default CrossPlatformQRCodeScanner;
