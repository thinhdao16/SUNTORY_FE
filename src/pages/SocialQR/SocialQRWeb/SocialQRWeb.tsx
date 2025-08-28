import { IonContent, IonPage } from "@ionic/react";
import "./SocialQRWeb.css";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router";
import { Html5Qrcode } from "html5-qrcode";
import UploadImgIcon from '@/icons/logo/social-chat/qr-upload-img.svg?react';
import YourQRIcon from '@/icons/logo/social-chat/qr-your-qr-code.svg?react';
import QRClose from '@/icons/logo/social-chat/qr-close.svg?react';
import { useToastStore } from "@/store/zustand/toast-store";
import { useCreateFriendshipByCode } from "@/pages/SocialChat/hooks/useSocialQR";
import { BrowserQRCodeReader } from "@zxing/browser";
import { QR_PREFIX } from "@/constants/global";

const SocialQRWeb = () => {
    const scanned = useRef(false);
    const ionBackground = useRef("");
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const [initialized, setInitialized] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isScanning, setIsScanning] = useState(true);
    const [isCreatingFriendship, setIsCreatingFriendship] = useState(false);
    const qrRegionId = "html5qr-code-full-region";
    const history = useHistory();
    const isStarting = useRef(false);
    const isRunning = useRef(false);
    const isNavigating = useRef(false); 
    const showToast = useToastStore.getState().showToast;

    const { mutate: createFriendship, isLoading } = useCreateFriendshipByCode({
        onSuccess: (data) => {
            React.startTransition(() => {
                setIsCreatingFriendship(false);
            });
            
            setTimeout(() => {
                if (!isNavigating.current) {
                    showToast(t("Friend request sent successfully!"), 3000, "success");
                    handleGoBack();
                }
            }, 100);
        },
        onError: (error) => {
            console.error("Create friendship failed:", error);
            
            React.startTransition(() => {
                scanned.current = false;
                setIsScanning(true);
                setIsCreatingFriendship(false);
            });
            
            setTimeout(() => {
                if (!isNavigating.current && !isRunning.current) {
                    setupHtml5Qrcode();
                }
            }, 100);
        },
    });

    const handleGoBack = () => {
        if (isNavigating.current) return;
        
        isNavigating.current = true;
        
        const cleanup = async () => {
            try {
                if (html5QrCodeRef.current && isRunning.current) {
                    await html5QrCodeRef.current.stop();
                    html5QrCodeRef.current.clear();
                    isRunning.current = false;
                }
            } catch (err) {
                console.warn("Stop scanner failed:", err);
            }
            
            setTimeout(() => {
                history.goBack();
            }, 50);
        };
        
        cleanup();
    };

    const decodeQRCodeFromFile = async (file: File) => {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);

        return new Promise<string | null>((resolve) => {
            img.onload = async () => {
                try {
                    const codeReader = new BrowserQRCodeReader();
                    const result = await codeReader.decodeFromImageElement(img);
                    resolve(result.getText());
                } catch (err) {
                    console.error("ZXing decode error:", err);
                    resolve(null);
                } finally {
                    URL.revokeObjectURL(img.src);
                }
            };
            img.onerror = () => {
                resolve(null);
            };
        });
    };

    const handleQRSuccess = (decodedText: string) => {
        if (!decodedText.startsWith(QR_PREFIX)) {
            console.log('Not a WayJet QR code:', decodedText);
            showToast(t("Invalid QR code format"), 3000, "warning");
            return;
        }

        if (scanned.current || !isScanning || isCreatingFriendship || isLoading || isNavigating.current) return;
        
        React.startTransition(() => {
            scanned.current = true;
            setIsScanning(false);
            setIsCreatingFriendship(true);
        });
        
        const userCode = decodedText.replace(QR_PREFIX, '');
        console.log('QR scanned from camera, user code:', userCode);
        
        if (html5QrCodeRef.current && isRunning.current) {
            html5QrCodeRef.current.stop()
                .then(() => {
                    isRunning.current = false;
                })
                .catch(console.warn);
        }
        
        setTimeout(() => {
            if (!isNavigating.current) {
                createFriendship({ 
                    toUserCode: userCode, 
                    inviteMessage: "" 
                });
            }
        }, 100);
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (isProcessing || isCreatingFriendship || isLoading || isNavigating.current) return;
        
        React.startTransition(() => {
            setIsProcessing(true);
        });

        try {
            const MAX_FILE_SIZE = 10 * 1024 * 1024;
            if (file.size > MAX_FILE_SIZE) {
                showToast(t("File is too large (>10MB)"), 3000, "error");
                return;
            }

            if (!file.type.startsWith('image/')) {
                showToast(t("Please select an image file"), 3000, "error");
                return;
            }

            showToast(t("Processing image..."), 2000, "info");

            const decodedText = await decodeQRCodeFromFile(file);

            if (decodedText) {
                if (!decodedText.startsWith(QR_PREFIX)) {
                    showToast(t("Invalid QR code format"), 3000, "warning");
                    return;
                }

                showToast(t("QR code found!"), 2000, "success");
                
                if (!scanned.current && !isCreatingFriendship && !isNavigating.current) {
                    React.startTransition(() => {
                        scanned.current = true;
                        setIsScanning(false);
                        setIsCreatingFriendship(true);
                    });
                    
                    const userCode = decodedText.replace(QR_PREFIX, '');
                    
                    setTimeout(() => {
                        if (!isNavigating.current) {
                            createFriendship({ toUserCode: userCode, inviteMessage: "" });
                        }
                    }, 100);
                }
            } else {
                showToast(t("No QR code found in image"), 3000, "warning");
            }

        } catch (error) {
            console.error("Error decoding QR from image:", error);
        } finally {
            React.startTransition(() => {
                setIsProcessing(false);
            });
            event.target.value = '';
        }
    };

    const setupHtml5Qrcode = async () => {
        if (isStarting.current || isRunning.current || isNavigating.current) return;
        isStarting.current = true;

        try {
            if (html5QrCodeRef.current) {
                try {
                    await html5QrCodeRef.current.stop();
                    html5QrCodeRef.current.clear();
                } catch (err) {
                    console.warn("Failed to clear previous scanner:", err);
                }
            }

            const qrCodeScanner = new Html5Qrcode(qrRegionId);
            const width = window.innerWidth;
            const height = window.innerHeight;
            const aspectRatio = width / height;
            const reverseAspectRatio = height / width;

            const mobileAspectRatio = reverseAspectRatio > 1.5
                ? reverseAspectRatio + (reverseAspectRatio * 12 / 100)
                : reverseAspectRatio;

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
                    if (!scanned.current && !isNavigating.current) {
                        handleQRSuccess(decodedText);
                    }
                },
                (errorMessage) => {
                }
            );
            isRunning.current = true;
        } catch (err) {
            console.error("html5-qrcode start failed:", err);
            showToast(t("Camera initialization failed"), 3000, "error");
        } finally {
            isStarting.current = false;
        }
    };

    const handleNavigateToQRCode = () => {
        if (isCreatingFriendship || isLoading || isNavigating.current) return;
        
        isNavigating.current = true;
        
        const navigateToQR = async () => {
            try {
                if (html5QrCodeRef.current && isRunning.current) {
                    await html5QrCodeRef.current.stop();
                    html5QrCodeRef.current.clear();
                    isRunning.current = false;
                }
            } catch (err) {
                console.warn("Stop scanner failed:", err);
            }
            
            setTimeout(() => {
                history.push('/social-partner/add');
            }, 50);
        };
        
        navigateToQR();
    };

    useEffect(() => {
        const init = async () => {
            try {
                await setupHtml5Qrcode();
                setInitialized(true);
            } catch (err) {
                console.error("Init scanner failed:", err);
            }
        };
        init();

        return () => {
            isNavigating.current = true;
            if (html5QrCodeRef.current && isRunning.current) {
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

    useEffect(() => {
        ionBackground.current = document.documentElement.style.getPropertyValue(
            "--ion-background-color"
        );
        sessionStorage.setItem("check_scan", "no");

        return () => {
            document.documentElement.style.setProperty(
                "--ion-background-color",
                ionBackground.current
            );
            scanned.current = false;
        };
    }, []);

    return (
        <IonPage>
            <IonContent fullscreen className="relative h-full p-0 m-0">
                {(isCreatingFriendship || isLoading) && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-4 flex flex-col items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                            <span className="text-sm">{t("Sending friend request...")}</span>
                        </div>
                    </div>
                )}

                <div className="absolute top-8 z-50 flex justify-between w-full px-4 text-white">
                    <div></div>
                    <div className="font-semibold text-center">{t("Scan to Rate")}</div>
                    <button 
                        type="button" 
                        onClick={handleGoBack} 
                        disabled={isNavigating.current}
                    >
                        <QRClose />
                    </button>
                </div>

                <div ref={containerRef}>
                    <div id="html5qr-code-full-region" />
                    <div id="html5qr-code-file-region" style={{ display: "none" }} />
                </div>

                <div className="fixed bottom-0 left-0 right-0 flex justify-around items-center bg-white pb-5 pt-3">
                    <div>
                        <label
                            htmlFor="upload-image"
                            className={`bg-white text-netural-300 gap-[6px] flex flex-col items-center justify-center text-sm cursor-pointer font-medium ${
                                isProcessing || isCreatingFriendship || isLoading || isNavigating.current ? 'opacity-50 pointer-events-none' : ''
                            }`}
                        >
                            <UploadImgIcon className="block" />
                            {isCreatingFriendship || isLoading ? t("Sending...") : 
                             isProcessing ? t("Processing...") : 
                             t("Upload Image")}
                        </label>
                        <input
                            id="upload-image"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={isProcessing || isCreatingFriendship || isLoading || isNavigating.current}
                        />
                    </div>
                    <div>
                        <button
                            className={`bg-white text-netural-300 gap-[6px] flex flex-col items-center justify-center text-sm cursor-pointer font-medium ${
                                isCreatingFriendship || isLoading || isNavigating.current ? 'opacity-50 pointer-events-none' : ''
                            }`}
                            onClick={handleNavigateToQRCode}
                            disabled={isCreatingFriendship || isLoading || isNavigating.current}
                        >
                            <YourQRIcon className="block" />
                            {t("Your QR Code")}
                        </button>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default SocialQRWeb;
