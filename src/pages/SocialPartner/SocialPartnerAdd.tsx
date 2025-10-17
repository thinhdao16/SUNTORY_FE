import MotionBottomSheet from '@/components/common/bottomSheet/MotionBottomSheet';
import MotionStyles from '@/components/common/bottomSheet/MotionStyles';
import ShareQRModal from '@/components/common/bottomSheet/ShareQRModal';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft, FiDownload, } from 'react-icons/fi'
import BackIcon from "@/icons/logo/back-default.svg?react"
import { useHistory } from 'react-router';
import {
    handleTouchStart as handleTouchStartUtil,
    handleTouchMove as handleTouchMoveUtil,
    handleTouchEnd as handleTouchEndUtil,
} from "@/utils/translate-utils";
import SearchPartnerModal from '@/components/common/bottomSheet/SearchPartnerModal';
import { Capacitor } from '@capacitor/core';
import { QRCodeCanvas } from "qrcode.react";
import { useAuthStore } from '@/store/zustand/auth-store';
import ShareQRCodeIcon from "@/icons/logo/social-chat/share-qr-code.svg?react"
import QRCodeMainIcon from "@/icons/logo/social-chat/qr-code-main.svg?react"
import { saveImage } from '@/utils/save-image';
import { getPublicUrlFromCanvas } from '@/utils/get-public-url-from-canvas';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share as CapShare } from "@capacitor/share";
import { QR_PREFIX } from '@/constants/global';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg"
import { useToastStore } from '@/store/zustand/toast-store';

const velocityThreshold = 0.4;
const SocialPartnerAdd = () => {
    const { t } = useTranslation();
    const showToast = useToastStore((state) => state.showToast);
    const [isOpen, setIsOpen] = useState({ shareQR: false, search: false });
    const [translateY, setTranslateY] = useState(0);
    const screenHeight = useRef(window.innerHeight);
    const startY = useRef<number | null>(null);
    const startTime = useRef<number | null>(null);
    const history = useHistory();
    const isNative = Capacitor.isNativePlatform();
    const { user } = useAuthStore()
    const valueQr = `${QR_PREFIX}${user?.code || "default-code"}`;

    const handleQR = () => {
        if (isNative) {
            history.push('/social-qr-native');
        } else {
            history.push('/social-qr-web');
        }
    };
    const openModal = (type: string) => {
        setIsOpen((prev) => ({ ...prev, [type]: true }));
        setTranslateY(0);
    };
    const closeModal = () => {
        setTranslateY(screenHeight.current);
        setTimeout(() => {
            setIsOpen({ shareQR: false, search: false });
            setTranslateY(0);
        }, 300);
    };
    const handleTouchStart = (e: React.TouchEvent) => {
        handleTouchStartUtil(e, startY, startTime);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        handleTouchMoveUtil(e, startY, screenHeight, setTranslateY);
    };

    const handleTouchEnd = () => {
        handleTouchEndUtil(
            translateY,
            startY,
            startTime,
            screenHeight,
            velocityThreshold,
            closeModal,
            setTranslateY
        );
    };
    const handleShareSystem = async () => {
        const canvas = document.getElementById("qr-gen") as HTMLCanvasElement | null;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL("image/png");
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], "qr-code.png", { type: "image/png" });

        if (Capacitor.isNativePlatform()) {
            const arrBuf = await file.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrBuf)));
            const writeRes = await Filesystem.writeFile({
                path: file.name,
                data: base64,
                directory: Directory.Cache,
            });

            await CapShare.share({
                title: "Share QR",
                url: writeRes.uri,
            });
        } else {
            const navAny = navigator as any;

            if (navAny?.canShare && navAny.canShare({ files: [file] })) {
                await navAny.share({
                    files: [file],
                    title: file.name,
                    text: "Scan my QR!",
                });
            } else {
                openModal("shareQR");
            }
        }
    };

    return (
        <MotionStyles
            isOpen={isOpen.shareQR || isOpen.search}
            translateY={translateY}
            screenHeight={screenHeight.current}
        >
            {({ scale, opacity, borderRadius, backgroundColor }) => (
                <div
                    className={`bg-white overflow-y-auto min-h-screen`}
                    style={{
                        backgroundColor: backgroundColor,
                        transition: isOpen.shareQR || isOpen.search ? "none" : "background-color 0.3s ease",
                        overflowY: 'auto',
                        height: '100vh'
                    }}
                >
                    <MotionBottomSheet
                        isOpen={isOpen.search || isOpen.shareQR}
                        scale={scale}
                        opacity={opacity}
                        borderRadius={borderRadius}
                    >
                        <div className="min-h-screen">
                            <div className="bg-white px-4 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <button className="" onClick={() => history.goBack()}>
                                        <BackIcon />
                                    </button>
                                    <h1 className="font-semibold uppercase tracking-wide">
                                        {t("Add Friend")}
                                    </h1>
                                    <div className="w-5" />
                                </div>

                                <div className="bg-blue-50 rounded-2xl p-6 flex flex-col items-center text-center mb-6">
                                    <div className="max-w-[200px] space-x-0 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={user?.avatarLink || avatarFallback}
                                                alt={user?.name}
                                                className="w-10 h-10 rounded-xl object-center"
                                                onError={(e) => {
                                                    e.currentTarget.src = avatarFallback;
                                                }}
                                            />
                                            <div className="text-start min-w-0">
                                                <p className="font-semibold text-sm truncate" title={user?.name || ""}>
                                                    {user?.name}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate" title={user?.email || ""}>
                                                    {user?.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="relative flex justify-center items-center bg-white p-6 rounded-xl border border-main">
                                            <QRCodeCanvas
                                                id="qr-gen"
                                                value={valueQr}
                                                size={150}
                                                level="H"
                                                marginSize={4}
                                            />
                                            <div className="absolute top-7 left-7 w-7 h-7 border-t-4 border-l-4 border-black rounded-tl-md" />
                                            <div className="absolute top-7 right-7 w-7 h-7 border-t-4 border-r-4 border-black rounded-tr-md" />
                                            <div className="absolute bottom-7 left-7 w-7 h-7 border-b-4 border-l-4 border-black rounded-bl-md" />
                                            <div className="absolute bottom-7 right-7 w-7 h-7 border-b-4 border-r-4 border-black rounded-br-md" />
                                        </div>
                                        <button className=" w-full  bg-main text-white text-sm font-semibold px-6 py-2 rounded-full flex items-center justify-center gap-2"
                                            // onClick={() => openModal("shareQR")}
                                            onClick={handleShareSystem}
                                        >
                                            <ShareQRCodeIcon />
                                            {t("Share QR Code")}
                                        </button>
                                        <button
                                            className="w-full border border-main text-main text-sm font-semibold px-6 py-2 rounded-full flex items-center justify-center gap-2"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                
                                                const canvas = document.getElementById('qr-gen') as HTMLCanvasElement | null;
                                                if (!canvas) {
                                                    showToast(t('QR code not found'), 2000, 'error');
                                                    return;
                                                }
                                                const dataUrl = canvas.toDataURL('image/png');

                                                try {
                                                    const timestamp = new Date().getTime();
                                                    await saveImage({ 
                                                        dataUrlOrBase64: dataUrl, 
                                                        fileName: `wayjet-qr-${timestamp}.png`,
                                                        albumIdentifier: 'WayJet'
                                                    });
                                                    showToast(t('Image saved to gallery'), 2000, 'success');
                                                } catch (e: any) {
                                                    console.error('[Save QR]', e);
                                                    
                                                    if (e?.message === 'PERMISSION_DENIED') {
                                                        showToast(t('Please allow access to photos'), 3000, 'error');
                                                    } else {
                                                        showToast(t('Failed to save image'), 2000, 'error');
                                                    }
                                                }
                                            }}
                                        >
                                            <FiDownload className="text-main text-lg" />
                                            {t('Save Image')}
                                        </button>

                                    </div>
                                </div>

                                <div className="my-6">
                                    <input
                                        type="text"
                                        placeholder={t("Username")}
                                        className="w-full rounded-lg px-4 py-2 text-sm bg-chat-to focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        onFocus={() => openModal("search")}
                                    />
                                </div>
                            </div>

                            <div className='px-6 border-t-[1px] border-netural-100 py-6 mt-8'>
                                <div className="flex items-center gap-2 cursor-pointer" onClick={handleQR}>
                                    <QRCodeMainIcon />
                                    <span>{t("Scan QR Code")}</span>
                                </div>
                            </div>

                            <div className="h-20"></div>
                        </div>
                    </MotionBottomSheet>

                    {/* Modals */}
                    <ShareQRModal
                        isOpen={isOpen.shareQR}
                        translateY={translateY}
                        onClose={closeModal}
                        handleTouchStart={handleTouchStart}
                        handleTouchMove={handleTouchMove}
                        handleTouchEnd={handleTouchEnd}
                        getPublicUrl={() => getPublicUrlFromCanvas('qr-gen', 'qr-code.png')}
                    />
                    <SearchPartnerModal
                        isOpen={isOpen.search}
                        translateY={translateY}
                        onClose={closeModal}
                        handleTouchStart={handleTouchStart}
                        handleTouchMove={handleTouchMove}
                        handleTouchEnd={handleTouchEnd}
                    />
                </div>
            )}
        </MotionStyles>
    )
}

export default SocialPartnerAdd
