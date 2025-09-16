import React, { useEffect, useState } from "react";
import { IonButton, IonIcon, IonSpinner } from "@ionic/react";
import { close } from "ionicons/icons";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { updateAccountInformationV3 } from "@/services/auth/auth-service";
import { UpdateAccountInformationV3Payload } from "@/services/auth/auth-types";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";
import { useToastStore } from "@/store/zustand/toast-store";

interface NameUpdateListModalProps {
    isOpen: boolean;
    onClose: () => void;
    translateY: number;
    handleTouchStart: (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent) => void;
    handleTouchEnd: () => void;
    showOverlay?: boolean;
    currentFirstName?: string;
    currentLastName?: string;
}

const NameUpdateListModal: React.FC<NameUpdateListModalProps> = ({
    isOpen,
    onClose,
    currentFirstName = '',
    currentLastName = '',
    translateY,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    showOverlay = true
}) => {
    const { t } = useTranslation();
    const { refetch } = useAuthInfo();
    const showToast = useToastStore.getState().showToast;
    const [firstName, setFirstName] = useState(currentFirstName);
    const [lastName, setLastName] = useState(currentLastName);
    const [isLoading, setIsLoading] = useState(false);

    // Check if name has changed from current values
    const hasNameChanged = firstName.trim() !== currentFirstName || lastName.trim() !== currentLastName;

    const SHEET_MAX_VH = 80;
    const HEADER_PX = 56;

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    useEffect(() => {
        if (isOpen) {
            setFirstName(currentFirstName);
            setLastName(currentLastName);
        }
    }, [isOpen, currentFirstName, currentLastName]);

    const handleSave = async () => {
        if (!firstName.trim() && !lastName.trim()) {
            showToast(t("First name and last name are required"), 1000, "error");
            return;
        }
        if (!firstName.trim()) {
            showToast(t("First name is required"), 1000, "error");
            return;
        }
        if (!lastName.trim()) {
            showToast(t("Last name is required"), 1000, "error");
            return;
        }

        setIsLoading(true);
        try {
            const payload: UpdateAccountInformationV3Payload = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                countryId: null,
                languageId: null,
                gender: null,
                yearOfBirth: null,
            };
            await updateAccountInformationV3(payload);
            await refetch();
            onClose();
        } catch (error) {
            console.error('Error updating name:', error);
            showToast(t("Failed to update name"), 3000, "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={`fixed inset-0 z-[9999] h-full flex justify-center items-end ${showOverlay ? 'bg-black/50' : 'bg-transparent'}`}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleOverlayClick}
                >
                    <div
                        className="w-full rounded-t-4xl shadow-lg bg-white overflow-hidden"
                        style={{
                            height: `${SHEET_MAX_VH}vh`,
                            transform: `translateY(${translateY}px)`,
                            touchAction: 'none',
                            transition: 'transform 0.08s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            willChange: 'transform'
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* Header */}
                        <div
                            className="px-2"
                            style={{ minHeight: HEADER_PX, display: 'flex', alignItems: 'center', touchAction: 'none' }}
                        >
                            {/* Left spacer to balance the close button so title stays centered */}
                            <div style={{ width: 56, height: HEADER_PX }} />
                            <div
                                style={{
                                    flex: 1,
                                    textAlign: 'center',
                                    fontWeight: 700,
                                    lineHeight: 1.2,
                                    wordBreak: 'break-word',
                                    overflow: 'hidden'
                                }}
                            >
                                {t('My name')}
                            </div>
                            <IonButton
                                fill="clear"
                                onClick={onClose}
                                style={{ width: 56, height: HEADER_PX, outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <IonIcon icon={close} style={{ width: 24, height: 24, color: '#000000' }} />
                            </IonButton>
                        </div>

                        {/* Scrollable Body */}
                        <div
                            style={{
                                height: `calc(${SHEET_MAX_VH}vh - ${HEADER_PX}px)`,
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            {/* Form Content */}
                            <div className="p-6 space-y-6 flex-1">
                                {/* First Name Field */}
                                <div>
                                    <label className="block text-m font-medium text-gray-800 mb-2">
                                        {t('First Name')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder={t('Enter first name')}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                        autoFocus
                                    />
                                </div>

                                {/* Last Name Field */}
                                <div>
                                    <label className="block text-m font-medium text-gray-800 mb-2">
                                        {t('Last Name')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder={t('Enter last name')}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Save Button - Fixed at bottom, moves up with keyboard */}
                            {hasNameChanged && (
                                <div className="px-4 py-4 border-t border-gray-100">
                                    <IonButton
                                        expand="block"
                                        shape="round"
                                        onClick={handleSave}
                                        className="h-14"
                                        style={{
                                            '--background': '#1152F4',
                                            '--background-hover': '#2563eb',
                                            'font-weight': '600'
                                        }}
                                    >
                                        {isLoading ? <IonSpinner name="crescent" /> : t('Save')}
                                    </IonButton>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NameUpdateListModal;