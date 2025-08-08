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
const SocialQRWeb = () => {
    const scanned = useRef(false);
    const ionBackground = useRef("");
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const [initialized, setInitialized] = useState(false);
    const qrRegionId = "html5qr-code-full-region";
    const history = useHistory()
    const isStarting = useRef(false);
    const isRunning = useRef(false);
    const showToast = useToastStore.getState().showToast;
    const { mutate: createFriendship, isLoading } = useCreateFriendshipByCode();
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
                    createFriendship({ toUserCode: decodedText, inviteMessage: "" });
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
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const qrCodeScanner = html5QrCodeRef.current || new Html5Qrcode(qrRegionId);

            const decodedText = await qrCodeScanner.scanFile(file, true);
            if (decodedText) {
                createFriendship({ toUserCode: decodedText, inviteMessage: "" });
            }
            try {
                // const url = new URL(decodedText);
                // alert(url);

            } catch {
                // alert(`Decoded: ${decodedText}`);
            }
        } catch (error) {
            console.error("Error decoding image file:", error);
            alert("Không thể đọc được mã QR từ hình ảnh.");
        }
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
                <div className="absolute top-8 z-50 flex justify-between w-full px-4 text-white">
                    <div></div>
                    <div className="font-semibold text-center">{t("Scan to Rate")}</div>
                    <button type="button" onClick={() => history.goBack()}>
                        <QRClose />
                    </button>
                </div>
                <div ref={containerRef}  >
                    <div id="html5qr-code-full-region" />
                </div>
                <div className="fixed bottom-0 left-0 right-0 flex justify-around items-center bg-white  pb-5 pt-3">
                    <div>
                        <label
                            htmlFor="upload-image"
                            className="bg-white text-netural-300 gap-[6px] flex flex-col items-center justify-center  text-sm  cursor-pointer font-medium"
                        >
                            <UploadImgIcon className="block" />
                            {t("Upload Image")}
                        </label>
                        <input
                            id="upload-image"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                    </div>
                    <div>
                        <button
                            className="bg-white text-netural-300 gap-[6px] flex flex-col items-center justify-center  text-sm  cursor-pointer font-medium"
                            onClick={() => history.push('/social-partner/add')}
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
