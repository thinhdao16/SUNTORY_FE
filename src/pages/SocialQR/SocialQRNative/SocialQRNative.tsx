import { useIonToast } from "@ionic/react";
import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import { Capacitor } from "@capacitor/core";
import { AndroidSettings, IOSSettings, NativeSettings } from "capacitor-native-settings";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { useTranslation } from "react-i18next";
import { BrowserQRCodeReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { App } from "@capacitor/app";

import FlashOnIcon from "@/icons/logo/take-photo/flash_on.svg?react";
import FlashOffIcon from "@/icons/logo/take-photo/flash.svg?react";
import CloseIcon from "@/icons/logo/take-photo/close.svg?react";
import GalleryIcon from "@/icons/logo/take-photo/image.svg?react";
import UploadImgIcon from "@/icons/logo/social-chat/qr-upload-img.svg?react";
import YourQRIcon from "@/icons/logo/social-chat/qr-your-qr-code.svg?react";

import { useCreateFriendshipByCode } from "@/pages/SocialChat/hooks/useSocialQR";
import { QR_PREFIX } from "@/constants/global";


const SocialQRNative: React.FC = () => {
    const [present, dismiss] = useIonToast();
    const history = useHistory();
    const { t } = useTranslation();

    const [flashOn, setFlashOn] = useState(false);
    const [isDecoding, setIsDecoding] = useState(false);
    const [hasScanned, setHasScanned] = useState(false);
    const [isCreatingFriendship, setIsCreatingFriendship] = useState(false); // ✅ Thêm state này

    const toastShownRef = useRef(false);
    const wasGrantedRef = useRef(false);
    const startingRef = useRef(false);
    const scannedRef = useRef(false);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const readerRef = useRef<BrowserQRCodeReader | null>(null);
    const liveActiveRef = useRef(false);
    const platform = Capacitor.getPlatform();

    const base64ToFile = (base64: string, filename: string): File => {
        const arr = base64.split(",");
        const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
        const bstr = atob(arr[1]);
        const u8arr = new Uint8Array(bstr.length);
        for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
        return new File([u8arr], filename, { type: mime });
    };

    const { mutate: createFriendship, isLoading } = useCreateFriendshipByCode({
        onSuccess: (data) => {
            setIsCreatingFriendship(false);

        },
        onError: (error) => {

            scannedRef.current = false;
            setHasScanned(false);
            setIsCreatingFriendship(false);

            if (!liveActiveRef.current) {
                startLiveScan();
            }
        },

    });

    const handleQRScanResult = (text: string) => {
        if (!text.startsWith(QR_PREFIX)) {
            console.log('Not a WayJet QR code:', text);
            present({ message: t("Invalid QR code format"), duration: 2000, color: "warning" });
            return;
        }

        if (scannedRef.current || hasScanned || isCreatingFriendship || isLoading) {
            console.log('Already processing or scanned, ignoring:', text);
            return;
        }

        scannedRef.current = true;
        setHasScanned(true);
        setIsCreatingFriendship(true);

        const userCode = text.replace(QR_PREFIX, '');
        console.log('QR scanned from camera, user code:', userCode);

        stopLiveScan();



        createFriendship({ toUserCode: userCode, inviteMessage: "" });
    };

    const ensureVideoPlays = (video: HTMLVideoElement) =>
        new Promise<void>((resolve) => {
            const start = () => {
                video.play().catch(() => { });
                resolve();
            };
            if (video.readyState >= 1) start();
            else video.addEventListener("loadedmetadata", start, { once: true });
        });

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
        } catch {
            present({ message: t("Cannot open device settings on this platform."), duration: 3000, color: "danger" });
        }
    };

    const stopLiveScan = () => {
        liveActiveRef.current = false;
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((t) => t.stop());
            videoRef.current.srcObject = null;
        }
        readerRef.current = null;
    };

    const startLiveScan = async () => {
        if (!videoRef.current || startingRef.current || hasScanned || isCreatingFriendship || isLoading) return;
        startingRef.current = true;

        try {
            if (!videoRef.current.srcObject) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" },
                    audio: false,
                });
                const v = videoRef.current;
                v.setAttribute("playsinline", "");
                v.muted = true;
                v.autoplay = true;
                v.srcObject = stream;
                await ensureVideoPlays(v);
            }

            if (!readerRef.current) {
                const hints = new Map();
                hints.set(DecodeHintType.TRY_HARDER, true);
                hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
                readerRef.current = new BrowserQRCodeReader(hints);
            }
            liveActiveRef.current = true;

            readerRef.current.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
                if (!liveActiveRef.current) return;

                if (result) {
                    const text = result.getText();
                    handleQRScanResult(text);
                }
            });
        } catch (e) {
            console.error("startLiveScan error:", e);
        } finally {
            startingRef.current = false;
        }
    };

    const checkPermission = async (opts?: { silent?: boolean }) => {
        const silent = !!opts?.silent;
        try {
            const p = await Camera.checkPermissions();
            let granted = p.camera === "granted";
            if (!granted) {
                const r = await Camera.requestPermissions({ permissions: ["camera"] as any });
                granted = r.camera === "granted";
                if (!granted) {
                    if (!silent && !toastShownRef.current) {
                        toastShownRef.current = true;
                        present({
                            message: t("Camera access denied. Please allow it in system settings."),
                            duration: 0,
                            color: "danger",
                            buttons: [
                                { text: t("Open Settings"), handler: openDeviceSettings },
                                {
                                    text: t("Close"),
                                    role: "cancel",
                                    handler: () => {
                                        dismiss();
                                        toastShownRef.current = false;
                                    },
                                },
                            ],
                        });
                    }
                    wasGrantedRef.current = false;
                    return false;
                }
            }

            if (!wasGrantedRef.current) {
                wasGrantedRef.current = true;
                if (toastShownRef.current) {
                    dismiss();
                    toastShownRef.current = false;
                }
                await startLiveScan();
            }

            return true;
        } catch {
            if (!silent && !toastShownRef.current) {
                toastShownRef.current = true;
                present({ message: t("Error during native camera check."), duration: 3000, color: "danger" });
            }
            wasGrantedRef.current = false;
            return false;
        }
    };

    const drawToCanvas = async (blob: Blob, maxDim = 1600) => {
        const img = document.createElement("img");
        const url = URL.createObjectURL(blob);
        await new Promise<void>((res, rej) => {
            img.onload = () => res();
            img.onerror = (e) => rej(e);
            img.src = url;
        });
        const w0 = img.naturalWidth || img.width;
        const h0 = img.naturalHeight || img.height;
        const scale = Math.min(1, maxDim / Math.max(w0, h0));
        const w = Math.max(1, Math.round(w0 * scale));
        const h = Math.max(1, Math.round(h0 * scale));
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d")!;
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        return c;
    };

    const toGray = (src: HTMLCanvasElement) => {
        const c = document.createElement("canvas");
        c.width = src.width;
        c.height = src.height;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(src, 0, 0);
        const id = ctx.getImageData(0, 0, c.width, c.height);
        const d = id.data;
        const contrast = 1.2;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        for (let i = 0; i < d.length; i += 4) {
            let y = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
            y = factor * (y - 128) + 128;
            y = y < 0 ? 0 : y > 255 ? 255 : y;
            d[i] = d[i + 1] = d[i + 2] = y;
            d[i + 3] = 255;
        }
        ctx.putImageData(id, 0, 0);
        return c;
    };

    const rotateCanvas = (src: HTMLCanvasElement, deg: 0 | 90 | 180 | 270) => {
        if (deg === 0) return src;
        const c = document.createElement("canvas");
        const ctx = c.getContext("2d")!;
        if (deg === 180) {
            c.width = src.width;
            c.height = src.height;
            ctx.translate(src.width, src.height);
            ctx.rotate(Math.PI);
            ctx.drawImage(src, 0, 0);
            return c;
        }
        c.width = src.height;
        c.height = src.width;
        ctx.translate(c.width / 2, c.height / 2);
        ctx.rotate((deg * Math.PI) / 180);
        ctx.drawImage(src, -src.width / 2, -src.height / 2);
        return c;
    };

    const cropCanvas = (src: HTMLCanvasElement, x: number, y: number, w: number, h: number) => {
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(w));
        c.height = Math.max(1, Math.round(h));
        const ctx = c.getContext("2d")!;
        ctx.drawImage(src, Math.round(x), Math.round(y), Math.round(w), Math.round(h), 0, 0, c.width, c.height);
        return c;
    };

    const decodeQRFromBlob = async (blob: Blob): Promise<string | null> => {
        try {
            if ("BarcodeDetector" in window) {
                // @ts-ignore
                const det = new window.BarcodeDetector({ formats: ["qr_code"] });
                const bmp = await createImageBitmap(blob);
                const codes = await det.detect(bmp);
                if (codes?.[0]?.rawValue) return codes[0].rawValue as string;
            }
        } catch { }

        const sizes = [1600, 1200, 800];
        const rotations: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270];
        const crops = [
            [0.0, 0.0, 1.0, 1.0],
            [0.1, 0.1, 0.8, 0.8],
            [0.15, 0.15, 0.7, 0.7],
            [0.05, 0.2, 0.9, 0.6],
            [0.2, 0.05, 0.6, 0.9],
        ] as const;

        try {
            const hints = new Map();
            hints.set(DecodeHintType.TRY_HARDER, true);
            hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
            const reader = new BrowserQRCodeReader(hints);

            for (const sz of sizes) {
                const base = await drawToCanvas(blob, sz);
                const baseGray = toGray(base);

                for (const rot of rotations) {
                    for (const canvas of [rotateCanvas(base, rot), rotateCanvas(baseGray, rot)]) {
                        try {
                            const res = await reader.decodeFromCanvas(canvas);
                            return res.getText();
                        } catch { }
                        const W = canvas.width,
                            H = canvas.height;
                        for (const [rx, ry, rw, rh] of crops) {
                            const c = cropCanvas(canvas, rx * W, ry * H, rw * W, rh * H);
                            try {
                                const r2 = await reader.decodeFromCanvas(c);
                                return r2.getText();
                            } catch { }
                        }
                    }
                }
            }
        } catch (e) {
            console.error("ZXing pipeline error:", e);
        }

        try {
            const mod = await import(/* @vite-ignore */ "jsqr").catch(() => null as any);
            if (mod?.default) {
                const jsQR = mod.default as (
                    data: Uint8ClampedArray,
                    w: number,
                    h: number,
                    opts?: any
                ) => { data?: string } | null;
                const c = await drawToCanvas(blob, 1200);
                const ctx = c.getContext("2d")!;
                const id = ctx.getImageData(0, 0, c.width, c.height);
                const qr = jsQR(id.data, id.width, id.height, { inversionAttempts: "attemptBoth" });
                if (qr?.data) return qr.data;
            }
        } catch { }

        return null;
    };

    const handleChooseFromGallery = async () => {
        if (isDecoding || hasScanned || isCreatingFriendship || isLoading) return;
        setIsDecoding(true);
        let blob: Blob | null = null;

        try {
            const photo = await Camera.getPhoto({
                source: CameraSource.Photos,
                resultType: CameraResultType.Base64,
                quality: 90,
                correctOrientation: true,
                allowEditing: false,
            });

            if (photo.base64String) {
                const dataUrl = `data:image/jpeg;base64,${photo.base64String}`;
                blob = base64ToFile(dataUrl, "gallery.jpg");
            } else if (photo.webPath) {
                const res = await fetch(photo.webPath);
                blob = await res.blob();
            } else {
                present({ message: t("No image selected"), duration: 2000, color: "warning" });
                return;
            }

            stopLiveScan();
            present({ message: t("Processing image..."), duration: 1200, color: "medium" });

            const text = await decodeQRFromBlob(blob);
            if (text) {
                if (!text.startsWith(QR_PREFIX)) {
                    present({ message: t("Invalid QR code format"), duration: 2000, color: "warning" });
                    await startLiveScan();
                    return;
                }

                present({ message: t("QR code found!"), duration: 1200, color: "success" });

                if (!scannedRef.current && !hasScanned && !isCreatingFriendship) {
                    scannedRef.current = true;
                    setHasScanned(true);
                    setIsCreatingFriendship(true);

                    const userCode = text.replace(QR_PREFIX, '');

                    present({
                        message: t("Sending friend request..."),
                        duration: 2000,
                        color: "medium"
                    });

                    createFriendship({ toUserCode: userCode, inviteMessage: "" });
                }
            } else {
                present({ message: t("No QR code found in image"), duration: 2000, color: "warning" });
                await startLiveScan();
            }
        } catch (e) {
            console.error("Gallery decode error:", e);
            present({ message: t("Unable to read QR from image"), duration: 2000, color: "danger" });
            await startLiveScan();
        } finally {
            setIsDecoding(false);
        }
    };

    useEffect(() => {
        return () => {
            scannedRef.current = false;
            setHasScanned(false);
            setIsCreatingFriendship(false);
            stopLiveScan();
            if (toastShownRef.current) {
                dismiss();
                toastShownRef.current = false;
            }
        };
    }, []);

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | null = null;
        let unmounted = false;

        const checkAndStart = async () => {
            if (unmounted) return;
            const ok = await checkPermission({ silent: true });
            if (ok && videoRef.current?.srcObject && intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        };

        (async () => {
            const ok = await checkPermission({ silent: false });
            if (!ok) intervalId = setInterval(checkAndStart, 5000);
        })();

        return () => {
            unmounted = true;
            if (intervalId) clearInterval(intervalId);
            stopLiveScan();
            if (toastShownRef.current) {
                dismiss();
                toastShownRef.current = false;
            }
        };
    }, []);

    useEffect(() => {
        const sub = App.addListener("appStateChange", async ({ isActive }) => {
            if (!isActive) return;
            await checkPermission({ silent: true });
        });

        const onFocus = async () => {
            if (videoRef.current?.srcObject) return;
            await checkPermission({ silent: true });
        };
        window.addEventListener("focus", onFocus);

        return () => {
            sub.then((s) => s.remove());
            window.removeEventListener("focus", onFocus);
        };
    }, []);

    const handleToggleFlash = async () => {
        try {
            const video = videoRef.current;
            const stream = video?.srcObject as MediaStream;
            const track = stream?.getVideoTracks?.()?.[0];
            const capabilities = track?.getCapabilities?.();
            if ((capabilities as any)?.torch) {
                const next = !flashOn;
                setFlashOn(next);
                await track.applyConstraints({ advanced: [{ torch: next }] as any });
            } else {
                present({ message: t("Device does not support flash!"), duration: 2000, color: "warning" });
            }
        } catch {
            present({ message: t("Failed to toggle flash!"), duration: 2000, color: "danger" });
        }
    };

    const stopAndBack = () => {
        stopLiveScan();
        history.goBack();
    };

    return (
        <div className="h-full relative bg-black grid items-center px-6">
            {(isCreatingFriendship || isLoading) && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-4 flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                        <span className="text-sm text-black">{t("Sending friend request...")}</span>
                    </div>
                </div>
            )}

            <div className="fixed top-6 left-0 right-0 z-10 p-6 flex items-center justify-between">
                <button
                    onClick={handleToggleFlash}
                    disabled={isCreatingFriendship || isLoading}
                >
                    {flashOn ? <FlashOnIcon aria-label="Flash On" /> : <FlashOffIcon aria-label="Flash Off" />}
                </button>
                <button
                    onClick={stopAndBack}
                >
                    <CloseIcon aria-label="Đóng" />
                </button>
            </div>

            <div className="flex justify-center items-center w-full h-full xl:max-w-[410px] pb-20">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="rounded-2xl w-full h-auto object-cover"
                    style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: "48px" }}
                />
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white pb-5 pt-3">
                <div className="flex justify-around items-end">
                    <button
                        onClick={handleChooseFromGallery}
                        className={`bg-white text-netural-300 gap-[6px] flex flex-col items-center justify-center text-sm cursor-pointer font-medium ${isDecoding || hasScanned || isCreatingFriendship || isLoading ? 'opacity-50 pointer-events-none' : ''
                            }`}
                        disabled={isDecoding || hasScanned || isCreatingFriendship || isLoading}
                    >
                        <GalleryIcon />
                        <UploadImgIcon className="block" aria-label="Upload Image" />
                        {isCreatingFriendship || isLoading ? t("Sending...") :
                            hasScanned ? t("Scanned") :
                                isDecoding ? t("Processing...") :
                                    t("Upload Image")}
                    </button>

                    <button
                        className={`bg-white text-netural-300 gap-[6px] flex flex-col items-center justify-center text-sm cursor-pointer font-medium ${hasScanned || isCreatingFriendship || isLoading ? 'opacity-50 pointer-events-none' : ''
                            }`}
                        onClick={() => history.push("/social-partner/add")}
                        disabled={hasScanned || isCreatingFriendship || isLoading}
                    >
                        <YourQRIcon className="block" />
                        {t("Your QR Code")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SocialQRNative;
