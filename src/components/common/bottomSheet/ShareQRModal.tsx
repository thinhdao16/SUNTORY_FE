import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiLink, FiDownload } from "react-icons/fi";

interface ShareQRModalProps {
  isOpen: boolean;
  translateY: number;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  onClose: () => void;
}

const shareOptions = [
  { label: "Partner", icon: "/icons/partner.svg" },
  { label: "Facebook", icon: "/icons/facebook.svg" },
  { label: "X", icon: "/icons/x.svg" },
  { label: "Whatsapp", icon: "/icons/whatsapp.svg" },
  { label: "Zalo", icon: "/icons/zalo.svg" },
];

const ShareQRModal: React.FC<ShareQRModalProps> = ({
  isOpen,
  translateY,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  onClose,
}) => {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
          style={{
            transform: `translateY(${translateY}px)`,
            touchAction: "none",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="text-sm font-semibold text-center flex-grow text-gray-900">
              Share QR Code
            </h2>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-500"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Share Options */}
          <div className="flex gap-3 px-4 py-2 overflow-x-auto justify-between">
            {shareOptions.map((item) => (
              <div key={item.label} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-blue-600" />
                <span className="text-xs text-gray-700 mt-1">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-4 py-4 space-y-2">
            <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 rounded-xl text-sm font-medium text-gray-800">
              Copy Link
              <FiLink />
            </button>
            <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 rounded-xl text-sm font-medium text-gray-800"
              onClick={() => {
                const canvas = document.getElementById("qr-gen") as HTMLCanvasElement;
                const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
                const downloadLink = document.createElement("a");
                downloadLink.href = pngUrl;
                downloadLink.download = "qr-code.png";
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
              }}
            >
              Save Image
              <FiDownload />
            </button>
          </div>

          {/* Bottom safe space for iOS */}
          <div className="h-4" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareQRModal;
