import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";

interface ImagesPreviewModalProps {
    open: boolean;
    images: string[];
    index: number;
    onClose: () => void;
    onIndexChange?: (i: number) => void;
}

const ImagesPreviewModal: React.FC<ImagesPreviewModalProps> = ({ open, images, index, onClose, onIndexChange }) => {
    const [cur, setCur] = React.useState(index);

    React.useEffect(() => { setCur(index); }, [index, open]);

    const prevImg = (e: React.MouseEvent) => { e.stopPropagation(); setCur(c => c > 0 ? c - 1 : images.length - 1); };
    const nextImg = (e: React.MouseEvent) => { e.stopPropagation(); setCur(c => c < images.length - 1 ? c + 1 : 0); };

    return (
        <AnimatePresence>
            {open && images[cur] && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <button
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white text-2xl rounded-full p-2"
                        onClick={prevImg}
                        style={{ zIndex: 51 }}
                        tabIndex={-1}
                    >‹</button>
                    <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white text-2xl rounded-full p-2"
                        onClick={nextImg}
                        style={{ zIndex: 51 }}
                        tabIndex={-1}
                    >›</button>
                    <div className="relative">
                        <motion.img
                            src={images[cur]}
                            alt={`Preview ${cur + 1}`}
                            className="max-w-[350px] max-h-[80vh] rounded-xl "
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            onClick={e => e.stopPropagation()}
                            draggable={false}
                        />
                        <button className="absolute top-4 right-4 text-white text-lg bg-black/50 rounded-full p-1" onClick={onClose}> <FiX size={14} /></button>
                    </div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm bg-black/40 rounded-lg px-4 py-1">
                        {cur + 1} / {images.length}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ImagesPreviewModal;
