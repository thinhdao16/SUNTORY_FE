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
    const [keyboardOffset, setKeyboardOffset] = useState(0);

    useEffect(() => {
        const vv = (window as any).visualViewport;
        if (!vv) return;
        const handleResize = () => {
            const offset = Math.max(0, (window.innerHeight - vv.height - vv.offsetTop));
            setKeyboardOffset(offset);
        };
        handleResize();
        vv.addEventListener('resize', handleResize);
        return () => vv.removeEventListener('resize', handleResize);
    }, []);

    // Check if name has changed from current values and is valid
    const hasNameChanged = firstName.trim() !== currentFirstName || lastName.trim() !== currentLastName;
    const isNameValid = firstName.trim().length > 0 && lastName.trim().length > 0 && firstName.length <= 20 && lastName.length <= 20;

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
            showToast(t("Name updated successfully"), 2000, "success");
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
                            <div className="text-center font-semibold"
                                style={{
                                    flex: 1,
                                    lineHeight: 1.2,
                                    wordBreak: 'break-word',
                                    overflow: 'hidden',
                                    fontSize: '15px',
                                    color: 'black'
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
                                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent ${
                                            firstName.length > 20 || firstName.trim().length === 0 ? 'border-red-300 focus:ring-red-400' : 'border-gray-300 focus:ring-black'
                                        }`}
                                        autoFocus
                                    />
                                    {firstName.length > 20 && (
                                        <p className="text-xs text-red-500 font-medium mt-1">
                                            {t("First name too long! Maximum 20 characters.")}
                                        </p>
                                    )}
                                    {firstName.trim().length === 0 && (
                                        <p className="text-xs text-red-500 font-medium mt-1">
                                            {t("First name is required!")}</p>
                                    )}
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
                                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent ${
                                            lastName.length > 20 || lastName.trim().length === 0 ? 'border-red-300 focus:ring-red-400' : 'border-gray-300 focus:ring-black'
                                        }`}
                                    />
                                    {lastName.length > 20 && (
                                        <p className="text-xs text-red-500 font-medium mt-1">{t("Last name too long! Maximum 20 characters.")}
                                        </p>
                                    )}
                                    {lastName.trim().length === 0 && (
                                        <p className="text-xs text-red-500 font-medium mt-1">
                                            {t("Last name is required!")}</p>
                                    )}
                                </div>
                            </div>

                            {/* Save Button - sticky and lifts above keyboard */}
                            {hasNameChanged && isNameValid && (
                                <div className="px-4 py-4 border-t border-gray-100"
                                    style={{
                                        position: 'sticky',
                                        bottom: 0,
                                        background: '#ffffff',
                                        paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${keyboardOffset}px + 12px)`,
                                        zIndex: 10
                                    }}
                                >
                                    <IonButton
                                        expand="block"
                                        shape="round"
                                        onClick={handleSave}
                                        className="h-14"
                                        style={{
                                            '--background': '#1152F4',
                                            '--background-hover': '#2563eb',
                                            'font-weight': '700',
                                            'borderRadius': '9999px',
                                            'boxShadow': '0 8px 20px rgba(17, 82, 244, 0.35)',
                                            'textTransform': 'uppercase',
                                            'letterSpacing': '0.5px'
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