import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { Capacitor } from "@capacitor/core";
import { Share as CapShare } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";

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


const shareOptions: { label: string; key: ShareTarget; icon: string }[] = [
  { label: "System", key: "system", icon: "/icons/share.svg" },
  { label: "Facebook", key: "facebook", icon: "/icons/facebook.svg" },
  { label: "X", key: "twitter", icon: "/icons/x.svg" },
  { label: "WhatsApp", key: "whatsapp", icon: "/icons/whatsapp.svg" },
  { label: "Zalo", key: "zalo", icon: "/icons/zalo.svg" },
  { label: "Instagram", key: "instagram", icon: "/icons/instagram.svg" }, 
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

      switch (target) {
        case "facebook": {
          if (!publicUrl) break;
          const u = encodeURIComponent(publicUrl);
          openIntent(`https://www.facebook.com/sharer/sharer.php?u=${u}`);
          return;
        }
        case "twitter": {
          if (!publicUrl) break;
          const u = encodeURIComponent(publicUrl);
          openIntent(`https://twitter.com/intent/tweet?url=${u}&text=${text}`);
          return;
        }
        case "whatsapp": {
          if (!publicUrl) break;
          const u = encodeURIComponent(publicUrl);
          openIntent(`https://wa.me/?text=${text}%20${u}`);
          return;
        }
        case "zalo": {
          if (!publicUrl) break;
          const u = encodeURIComponent(publicUrl);
          openIntent(`https://zalo.me/share?url=${u}`);
          return;
        }
        case "instagram": {
          const ok = await shareViaSystemSheet(file);
          if (ok) return;
          if (publicUrl) {
            openIntent(`https://www.instagram.com/`);
            return;
          }

          if (isIOS()) {
            const url = URL.createObjectURL(file);
            const viewer = window.open("about:blank", "_blank", "noopener,noreferrer");
            if (viewer) {
              viewer.document.write(`
              <!doctype html><meta name="viewport" content="width=device-width,initial-scale=1" />
              <title>${file.name.replace(/</g, '&lt;')}</title>
              <style>html,body{margin:0;height:100%;background:#000;display:flex}
              img{max-width:100%;max-height:100%;margin:auto}</style>
              <img src="${url}" alt="${file.name}"/>
            `);
              viewer.document.close();
            } else {
              window.location.href = url;
            }
          } else {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(file);
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
          return;
        }
      }
      const ok = await shareViaSystemSheet(file);
      if (ok) return;

      if (isIOS()) {
        const url = URL.createObjectURL(file);
        const viewer = window.open("about:blank", "_blank", "noopener,noreferrer");
        if (viewer) {
          viewer.document.write(`
          <!doctype html><meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>${file.name.replace(/</g, '&lt;')}</title>
          <style>html,body{margin:0;height:100%;background:#000;display:flex}
          img{max-width:100%;max-height:100%;margin:auto}</style>
          <img src="${url}" alt="${file.name}"/>
        `);
          viewer.document.close();
        } else {
          window.location.href = url;
        }
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(file);
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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

          <div className="flex gap-4 px-4 py-3 overflow-x-auto">
            {shareOptions.map((item) => (
              <button
                key={item.key}
                onClick={() => handleShareClick(item.key)}
                className="flex flex-col items-center w-20 shrink-0 focus:outline-none"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-50 grid place-content-center ring-1 ring-blue-100">
                  <img src={item.icon} alt={item.label} className="w-7 h-7" />
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
