import React, { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BottomSheetProps {
    isOpen: boolean;
    translateY: number;
    closeModal: () => void;
    handleTouchStart: (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent) => void;
    handleTouchEnd: () => void;
    title?: string;
    showHeader?: boolean;
    children: ReactNode;
    maxWidth?: string;
    roundedTop?: string;
    showHandleBar?: boolean;
    overlayClass?: string;
    contentClass?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
    isOpen,
    translateY,
    closeModal,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    title,
    showHeader = false,
    showHandleBar = true,
    children,
    maxWidth = "450px",
    roundedTop = "rounded-t-4xl",
    overlayClass = "",
    contentClass = "",
}) => {
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) closeModal();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[160] h-full flex justify-center items-end"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={handleOverlayClick}
            >
                <motion.div
                    className={`w-full ${contentClass}`}
                    style={{ maxWidth }}
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <div
                        className={`w-full h-fit shadow-lg bg-white transition-transform duration-300 ease-out ${roundedTop}`}
                        style={{ transform: `translateY(${translateY}px)`, touchAction: "none" }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {showHandleBar && (
                            <div className="w-full flex justify-center pt-5">
                                <div className="w-10 h-1 bg-netural-100 rounded-full"></div>
                            </div>
                        )}

                        {showHeader && title && (
                            <div className="p-4">
                                <div className="flex items-center justify-center relative">
                                    <span className="font-semibold text-netural-500">{title}</span>
                                </div>
                            </div>
                        )}
                        <div className="overflow-auto">
                            {children}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default BottomSheet;