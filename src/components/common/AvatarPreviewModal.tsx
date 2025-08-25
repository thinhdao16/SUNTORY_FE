import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";

interface AvatarPreviewModalProps {
    open: boolean;
    src: string;
    alt?: string;
    onClose: () => void;
}

const AvatarPreviewModal: React.FC<AvatarPreviewModalProps> = ({ open, src, alt, onClose }) => (
    <AnimatePresence>
        {open && (
            <motion.div
                className="fixed inset-0 z-999 flex items-center justify-center bg-black/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <div className="relative">
                    <motion.img
                        src={src}
                        alt={alt || "Avatar Preview"}
                        className="max-w-[350px] max-h-[80vh]"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        onClick={e => e.stopPropagation()}
                    />
                    <button className="absolute top-4 right-4 text-white text-lg bg-black/50 rounded-full p-1" onClick={onClose}> <FiX size={14} /></button>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);

export default AvatarPreviewModal;