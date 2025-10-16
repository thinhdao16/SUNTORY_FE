import React, { useEffect, useState } from "react";
import { IonIcon } from "@ionic/react";
import { checkmarkDone, trash } from "ionicons/icons";
import { useTranslation } from "react-i18next";
import { deleteNotificationApi, readNotificationApi, ReadNotificationParams } from "@/services/social/social-notification";
import BottomSheet from "@/components/common/BottomSheet";
import ConfirmModal from "../modals/ConfirmModal";


interface NotificationBottomModalProps {
    isOpen?: boolean;
    onClose?: () => void;
    notificationIds?: number[] | null;
    translateY?: number;
    handleMarkAsRead?: () => void;
    handleTouchStart?: (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent) => void;
    handleTouchEnd: () => void;
    showOverlay?: boolean;
    onModalStateChange?: (isOpen?: boolean) => void;
    isFromHeader?: boolean;
    lockDismiss?: boolean;
    handleDelete?: () => void;
}
const NotificationBottomModal: React.FC<NotificationBottomModalProps> = ({
    isOpen,
    onClose,
    notificationIds = null,
    translateY: _translateY,
    handleMarkAsRead,
    handleTouchStart: _handleTouchStart,
    handleTouchMove: _handleTouchMove,
    handleTouchEnd: _handleTouchEnd,
    handleDelete,
    showOverlay: _showOverlay = true,
    onModalStateChange,
    isFromHeader = false,
    lockDismiss,
}) => {
    const { t } = useTranslation();

    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        <>
            <BottomSheet
                isOpen={Boolean(isOpen)}
                onClose={onClose || (() => {})}
                title={null}
                showCloseButton={false}
                lockDismiss={lockDismiss ?? isSaving}
                classNameContainer="!bg-netural-50"
            >
                <div className="flex flex-col items-center pt-3 " onClick={(e) => e.stopPropagation()}>
                    <div className="w-full px-4">
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                            <button
                                className={`w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors ${!isFromHeader ? 'border-b border-gray-100' : ''}`}
                                onClick={handleMarkRead}
                                disabled={isSaving}
                            >
                                <span className="text-black text-[15px] font-medium">{!isFromHeader ? t('Mark as read') : t('Mark all as read')}</span>
                                <IonIcon icon={checkmarkDone} className="w-5 h-5 text-black" />
                            </button>
                            {!isFromHeader && (
                                <button
                                    className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-red-50 transition-colors"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isSaving}
                                >
                                    <span className="text-red-500 text-[15px] font-medium">{t('Delete this notification')}</span>
                                    <IonIcon icon={trash} className="w-5 h-5 text-red-500" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </BottomSheet>
            <ConfirmModal
                isOpen={showDeleteConfirm}
                title={t('Confirm')}
                message={t('Are you sure you want to delete this notification?')}
                confirmText={t('Yes, delete')}
                cancelText={t('Cancel')}
                onConfirm={() => { handleDeleteNotification?.(); }}
                onClose={() => setShowDeleteConfirm(false)}
            />
        </>
    );
};
export default NotificationBottomModal;