import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { Capacitor } from "@capacitor/core";
import { Share as CapShare } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { AppLauncher } from "@capacitor/app-launcher";

import FacebookIcon from "@/icons/logo/social-chat/facebook.svg?react";
import XIcon from "@/icons/logo/social-chat/x.svg?react";
import WhatsAppIcon from "@/icons/logo/social-chat/whatsapp.svg?react";
import EmailIcon from "@/icons/logo/social-chat/email.svg?react";
import LinkedinIcon from "@/icons/logo/social-chat/linked-in.svg?react";
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
  | "partner"
  | "linkedin"
  | "email"
  | "partner";

const shareOptions: { label: string; key: ShareTarget; icon: React.ReactNode }[] = [
  // { label: "System", key: "system", icon: <SystemIcon /> },
  { label: "Facebook", key: "facebook", icon: <FacebookIcon /> },
  { label: "X", key: "twitter", icon: <XIcon /> },
  { label: "WhatsApp", key: "whatsapp", icon: <WhatsAppIcon /> },
  // { label: "Zalo", key: "zalo", icon: <ZaloIcon /> },
  // { label: "Instagram", key: "instagram", icon: <InstagramIcon /> },
  { label: "LinkedIn", key: "linkedin", icon: <LinkedinIcon /> },
  { label: "Email", key: "email", icon: <EmailIcon /> },
];

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

  const shareViaSystemSheet = useCallback(async (file: File) => {
    if (Capacitor.isNativePlatform()) {
      console.log("first")
      const arrBuf = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrBuf)));
      const path = file.name;
      const writeRes = await Filesystem.writeFile({
        path,
        data: base64,
        directory: Directory.Cache,
      });
      await CapShare.share({
        title: "Share QR",
        url: writeRes.uri,
      });
      return true;
    }

    const navAny = navigator as any;
    if (navAny?.canShare && navAny.canShare({ files: [file] })) {
      await navAny.share({
        files: [file],
        title: file.name,
        text: "Scan my QR!",
      });
      return true;
    }

    return false;
  }, []);

  const handleShareClick = useCallback(
    async (target: ShareTarget) => {
      if (target === "partner") return;

      const file = await getQRFile();
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
      const isNative = Capacitor.isNativePlatform();

      switch (target) {
        // case "system":
        //   if (file) await shareViaSystemSheet(file);
        //   return;

        case "facebook":
          if (isNative) {
            await AppLauncher.openUrl({ url: `fb://faceweb/f?href=${u}` });
          } else {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`, "_blank");
          }
          return;

        case "twitter":
          if (isNative) {
            await AppLauncher.openUrl({ url: `twitter://post?message=${text}%20${u}` });
          } else {
            window.open(`https://twitter.com/intent/tweet?url=${u}&text=${text}`, "_blank");
          }
          return;

        case "whatsapp":
          if (isNative) {
            await AppLauncher.openUrl({ url: `whatsapp://send?text=${text}%20${u}` });
          } else {
            window.open(`https://wa.me/?text=${text}%20${u}`, "_blank");
          }
          return;

        case "zalo":
          if (isNative) {
            await AppLauncher.openUrl({ url: `zalo://qr?p=${u}` });
          } else {
            window.open(`https://zalo.me/share?url=${u}`, "_blank");
          }
          return;

        case "instagram":
          if (isNative && file) {
            await shareViaSystemSheet(file);
          } else {
            alert("Instagram share only supported in mobile app");
          }
          return;

        case "linkedin":
          if (isNative) {
            await AppLauncher.openUrl({ url: `linkedin://shareArticle?mini=true&url=${u}&title=${text}` });
          } else {
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${u}`, "_blank");
          }
          return;

        case "email":
          const subject = encodeURIComponent("Scan my QR!");
          const body = encodeURIComponent(`Xin chào,\n\nMời bạn quét QR: ${publicUrl || ""}`);
          if (isNative) {
            await AppLauncher.openUrl({ url: `mailto:?subject=${subject}&body=${body}` });
          } else {
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
          }
          return;

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
              {t("Share QR Code")}</h2>
            <button onClick={onClose} className="absolute right-4 top-4 text-gray-500">
              <FiX size={20} />
            </button>
          </div>

          <div className="flex gap-4 px-4 py-3 overflow-x-auto justify-evenly">
            {shareOptions.map((item) => (
              <button
                key={item.key}
                onClick={() => handleShareClick(item.key)}
                className="flex flex-col items-center shrink-0 focus:outline-none"
              >
                <div className="grid place-content-center">{item.icon}</div>
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
