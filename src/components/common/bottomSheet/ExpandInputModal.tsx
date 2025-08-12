import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { close } from "ionicons/icons";

interface ExpandInputModalProps {
    isOpen: boolean;
    translateY: number;
    closeModal: () => void;
    handleTouchStart: (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent) => void;
    handleTouchEnd: () => void;
    title?: string;

    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}

const ExpandInputModal: React.FC<ExpandInputModalProps> = ({
    isOpen,
    translateY,
    closeModal,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    title = "Your Full Message",
    value,
    onChange,
    placeholder = "Type here...",
}) => {
    const taRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen && taRef.current) {
            const el = taRef.current;
            el.focus();
            el.selectionStart = el.selectionEnd = el.value.length;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 1000)}px`;
        }
    }, [isOpen, value]);

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
                <div
                    className="w-full h-[85%] rounded-t-4xl shadow-lg bg-white transition-transform duration-300 ease-out"
                    style={{ transform: `translateY(${translateY}px)`, touchAction: "none" }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-4 rounded-t-4xl ">
                        <div className="flex items-center justify-center relative">
                            <span className="font-semibold text-netural-500">{title}</span>
                            <button
                                className="absolute left-0 top-0 p-1 rounded-full hover:bg-gray-100"
                                onClick={closeModal}
                            >
                                <IonIcon icon={close} className="text-xl text-gray-600" />
                            </button>
                        </div>
                    </div>

                    <div className="px-4 pb-4 h-[calc(100%-64px)]">
                        <textarea
                            ref={taRef}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            className="w-full h-full outline-none resize-none text-[15px] leading-relaxed"
                            onInput={(e) => {
                                const el = e.currentTarget;
                                el.style.height = "auto";
                                el.style.height = `${Math.min(el.scrollHeight, 1200)}px`;
                            }}
                        />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ExpandInputModal;
