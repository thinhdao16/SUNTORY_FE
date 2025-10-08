import React, { useEffect, useState } from "react";
import { IonIcon } from "@ionic/react";
import { checkmark, checkmarkDone, trash } from "ionicons/icons";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { deleteNotificationApi, readNotificationApi, ReadNotificationParams } from "@/services/social/social-notification";
import httpClient from "@/config/http-client";
import LineIcon from "@/icons/logo/social/line.svg?react";
import ConfirmModal from "../modals/ConfirmModal";


interface NotificationBottomModalProps {
    isOpen?: boolean;
    onClose?: () => void;
    notificationIds?: number[] | null;
    translateY?: number;
    handleMarkAsRead?: () => void;
    handleTouchStart?: (e: React.TouchEvent) => void;
    handleDelete?: () => void;
    handleTouchMove: (e: React.TouchEvent) => void;
    handleTouchEnd: () => void;
    showOverlay?: boolean;
    onModalStateChange?: (isOpen?: boolean) => void;
    isFromHeader?: boolean;
}
const NotificationBottomModal: React.FC<NotificationBottomModalProps> = ({
    isOpen,
    onClose,
    notificationIds = null,
    translateY,
    handleMarkAsRead,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleDelete,
    showOverlay = true,
    onModalStateChange,
    isFromHeader = false
}) => {
    const { t } = useTranslation();

    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose?.();
    };

    const SHEET_MAX_VH = isFromHeader == false ? 24 : 14;
    const HEADER_PX = 56;

    // Notify parent about modal state changes
    useEffect(() => {
        onModalStateChange?.(isOpen || false);
    }, [isOpen, onModalStateChange]);

    const handleMarkRead = async () => {
        setIsSaving(true);
        try {
            if (isFromHeader == false) {
                const payload: ReadNotificationParams = {
                    ids: notificationIds as number[],
                    isAll: false
                };
                await readNotificationApi(payload);
                handleMarkAsRead?.();
            }
            else {
                const payload: ReadNotificationParams = {
                    ids: notificationIds as number[],
                    isAll: true
                };
                await readNotificationApi(payload);
                handleMarkAsRead?.();
            }
            onClose?.();
        } catch (error) {
            console.error("Error reading notification:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteNotification = async () => {
        setIsSaving(true);
        try {
            // TODO: Update with actual delete API endpoint when available
            await deleteNotificationApi({ id: notificationIds?.[0] as number });
            handleDelete?.();
            onClose?.();
        } catch (error) {
            console.error("Error deleting notification:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={`fixed inset-0 z-[9999] h-screen flex justify-center items-end ${showOverlay ? 'bg-black/50' : 'bg-transparent'}`}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleOverlayClick}
                    style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        top: 0,
                        zIndex: 9999
                    }}
                >
                    <div
                        className="w-full shadow-lg bg-[#EBECEE] overflow-hidden rounded-t-4xl"
                        style={{
                            height: `calc(${SHEET_MAX_VH}vh - ${HEADER_PX}px)`,
                            transform: `translateY(${translateY}px)`,
                            touchAction: 'none',
                            transition: 'transform 0.08s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            willChange: 'transform',
                            maxHeight: `${SHEET_MAX_VH}vh`,
                            minHeight: '120px',
                            position: 'relative',
                            bottom: 0,
                            left: 0,
                            right: 0
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="flex flex-col items-center pt-3 pb-6">
                            {/* Drag handle */}
                            <div className="flex justify-center mb-4">
                                <div className="w-12 h-1 bg-gray-400 rounded-full"></div>
                            </div>

                            {/* Content */}
                            <div className="w-full px-4">
                                <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                                    {/* Mark as read button */}
                                    <button
                                        className={`w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors ${!isFromHeader ? 'border-b border-gray-100' : ''}`}
                                        onClick={() => handleMarkRead?.()}
                                        disabled={isSaving}
                                    >
                                        <span className="text-black text-[15px] font-medium">{!isFromHeader ? 'Mark as read' : 'Mark all as read'}</span>
                                        <IonIcon icon={checkmarkDone} className="w-5 h-5 text-black" />
                                    </button>

                                    {/* Delete button */}
                                    {!isFromHeader && (
                                        <button
                                            className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-red-50 transition-colors"
                                            onClick={() => setShowDeleteConfirm(true)}
                                            disabled={isSaving}
                                        >
                                            <span className="text-black text-[15px] font-medium">Delete this notification</span>
                                            <IonIcon icon={trash} className="w-5 h-5 text-red-500" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                title={t('Confirm')}
                message={t('Are you sure you want to delete this notification?')}
                confirmText={t('Yes, delete')}
                cancelText={t('Cancel')}
                onConfirm={() => { handleDeleteNotification?.(); }}
                onClose={() => setShowDeleteConfirm(false)}
            />
        </AnimatePresence>

    );
};
export default NotificationBottomModal;