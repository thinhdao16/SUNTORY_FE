import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { Capacitor } from "@capacitor/core";
import { Share as CapShare } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";
import InstagramIcon from "@/icons/logo/social-chat/instagram.svg?react";
import FacebookIcon from "@/icons/logo/social-chat/facebook.svg?react";
import XIcon from "@/icons/logo/social-chat/x.svg?react";
import WhatsAppIcon from "@/icons/logo/social-chat/whatsapp.svg?react";
import ZaloIcon from "@/icons/logo/social-chat/zalo.svg?react";
import SystemIcon from "@/icons/logo/social-chat/system.svg?react";
interface ShareQRModalProps {
  isOpen: boolean;
  translateY: number;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  onClose: () => void;

  getPublicUrl?: () => Promise<string | null>;
}

type ShareTarget =
  | "system"
  | "facebook"
  | "twitter"
  | "whatsapp"
  | "zalo"
  | "instagram"
  | "partner";


const shareOptions: { label: string; key: ShareTarget; icon: React.ReactNode }[] = [
  { label: t("System"), key: "system", icon: <SystemIcon /> },
  { label: "Facebook", key: "facebook", icon: <FacebookIcon /> },
  { label: "X", key: "twitter", icon: <XIcon /> },
  { label: "WhatsApp", key: "whatsapp", icon: <WhatsAppIcon /> },
  { label: "Zalo", key: "zalo", icon: <ZaloIcon /> },
  { label: "Instagram", key: "instagram", icon: <InstagramIcon /> },
];


const isIOS = () => {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac OS X") && "ontouchend" in document);
};

async function getQRFile(fileName = "qr-code.png"): Promise<File | null> {
  const canvas = document.getElementById("qr-gen") as HTMLCanvasElement | null;
  if (!canvas) return null;
  const dataUrl = canvas.toDataURL("image/png");
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], fileName, { type: "image/png" });
}

const ShareQRModal: React.FC<ShareQRModalProps> = ({
  isOpen,
  translateY,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  onClose,
  getPublicUrl,
}) => {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const shareViaSystemSheet = useCallback(
    async (file: File) => {
      if (Capacitor.isNativePlatform()) {
        const arrBuf = await file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrBuf)));
        const path = file.name;
        const writeRes = await Filesystem.writeFile({
          path,
          data: base64,
          directory: Directory.Cache,
        });
        await CapShare.share({
          title: "Share image",
          url: writeRes.uri,
        });
        return true;
      }

      const navAny = navigator as any;
      if (navAny?.canShare && navAny.canShare({ files: [file] })) {
        await navAny.share({
          files: [file],
          title: file.name,
          text: "Share image",
        });
        return true;
      }

      return false;
    },
    []
  );

  const openIntent = (url: string) => {
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) {
      window.location.href = url;
    }
  };

const handleShareClick = useCallback(
  async (target: ShareTarget) => {
    if (target === "partner") return;

    const file = await getQRFile();
    if (!file) return;

    // Native: mở system share sheet
    if (target === "system") {
      const ok = await shareViaSystemSheet(file);
      if (!ok) {
        const url = URL.createObjectURL(file);
        const win = window.open(url, "_blank");
        if (!win) window.location.href = url;
      }
      return;
    }

    let publicUrl: string | null = null;
    if (getPublicUrl) {
      try {
        publicUrl = await getPublicUrl();
      } catch {
        publicUrl = null;
      }
    }

    const text = encodeURIComponent("Scan my QR!");
    const u = publicUrl ? encodeURIComponent(publicUrl) : "";

    switch (target) {
      case "facebook": {
        window.location.href = `fb://faceweb/f?href=${u}`;
        setTimeout(() => {
          openIntent(`https://www.facebook.com/sharer/sharer.php?u=${u}`);
        }, 1500);
        return;
      }
      case "twitter": {
        window.location.href = `twitter://post?message=${text}%20${u}`;
        setTimeout(() => {
          openIntent(`https://twitter.com/intent/tweet?url=${u}&text=${text}`);
        }, 1500);
        return;
      }
      case "whatsapp": {
        window.location.href = `whatsapp://send?text=${text}%20${u}`;
        setTimeout(() => {
          openIntent(`https://wa.me/?text=${text}%20${u}`);
        }, 1500);
        return;
      }
      case "zalo": {
        window.location.href = `zalo://qr?p=${u}`;
        setTimeout(() => {
          openIntent(`https://zalo.me/share?url=${u}`);
        }, 1500);
        return;
      }
      case "instagram": {
        const ok = await shareViaSystemSheet(file);
        if (ok) return;
        window.location.href = `instagram://camera`;
        return;
      }
    }
  },
  [getPublicUrl, shareViaSystemSheet]
);


  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[150] h-full flex justify-center items-end"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={handleOverlayClick}
      >
        <div
          className="bg-white w-full rounded-t-3xl shadow-xl"
          style={{ transform: `translateY(${translateY}px)`, touchAction: "none" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="text-sm font-semibold text-center flex-grow text-gray-900">
              Share QR Code
            </h2>
            <button onClick={onClose} className="absolute right-4 top-4 text-gray-500">
              <FiX size={20} />
            </button>
          </div>

          <div className="flex gap-4 px-4 py-3 overflow-x-auto justify-between">
            {shareOptions.map((item) => (
              <button
                key={item.key}
                onClick={() => handleShareClick(item.key)}
                className="flex flex-col items-center  shrink-0 focus:outline-none"
              >
                <div className=" grid place-content-center ">
                  {item.icon}
                </div>
                <span className="text-xs text-gray-700 mt-2">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="h-4" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareQRModal;
