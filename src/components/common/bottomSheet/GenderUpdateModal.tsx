import React, { useEffect, useState, useTransition } from "react";
import { IonButton, IonIcon, IonSpinner } from "@ionic/react";
import { close } from "ionicons/icons";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { updateAccountInformationV3 } from "@/services/auth/auth-service";
import { UpdateAccountInformationV3Payload } from "@/services/auth/auth-types";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";
import FemaleIcon from "@/icons/logo/profile/female.svg?react";
import MaleIcon from "@/icons/logo/profile/male.svg?react";


interface GenderUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    translateY: number;
    handleTouchStart: (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent) => void;
    handleTouchEnd: () => void;
    showOverlay?: boolean;
    currentGender?: number; // 1 = Male, 2 = Female
}

const GenderUpdateModal: React.FC<GenderUpdateModalProps> = ({
    isOpen,
    onClose,
    currentGender,
    translateY,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    showOverlay = true
}) => {
    const { t } = useTranslation();
    const { refetch } = useAuthInfo();
    const [tempSelected, setTempSelected] = useState<number | undefined>(currentGender || 1);
    const [isSaving, setIsSaving] = useState(false);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    const SHEET_MAX_VH = 80;
    const HEADER_PX = 56;

    useEffect(() => {
        if (isOpen) {
            setTempSelected(currentGender);
        }
    }, [isOpen, currentGender]);

    const handleSave = async () => {
        if (!tempSelected) return;
        setIsSaving(true);
        try {
            const payload: UpdateAccountInformationV3Payload = {
                gender: tempSelected,
                countryId: null,
                languageId: null,
                firstName: null,
                lastName: null,
                yearOfBirth: null,
            };
            await updateAccountInformationV3(payload);
            await refetch();
            onClose();
        } catch (error) {
            console.error('Error updating gender:', error);
        } finally {
            setIsSaving(false);
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
                                {t('My sex assigned at birth')}
                            </div>
                            <IonButton
                                fill="clear"
                                onClick={onClose}
                                style={{ width: 56, height: HEADER_PX, outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <IonIcon icon={close} style={{ width: 24, height: 24, color: '#000000' }} />
                            </IonButton>
                        </div>

                        {/* Content */}
                        <div
                            style={{
                                height: `calc(${SHEET_MAX_VH}vh - ${HEADER_PX}px)`,
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            {/* Scrollable Content */}
                            <div
                                className="flex-1 overflow-y-auto"
                                style={{ paddingBottom: '60px' }}
                            >
                                {/* Gender Buttons */}
                                <div className="p-4 flex items-center justify-center min-h-full">
                                    <div className="flex gap-6 w-full max-w-md">
                                        {/* Female Button */}
                                        <button
                                            type="button"
                                            onClick={() => setTempSelected(2)}
                                            className={`flex-1 flex flex-col items-center justify-center transition-all duration-200 ${tempSelected === 2
                                                    ? 'bg-pink-100'
                                                    : 'bg-white border border-gray-300'
                                                }`}
                                            style={{
                                                width: '240px',
                                                height: '180px',
                                                borderRadius: '16px',
                                                borderWidth: tempSelected === 2 ? '0px' : '1px',
                                                paddingTop: '20px',
                                                paddingRight: '24px',
                                                paddingBottom: '20px',
                                                paddingLeft: '24px'
                                            }}
                                        >
                                            <div className="w-24 h-24 mb-4 flex items-center justify-center">
                                                <FemaleIcon className="w-full h-full" />
                                            </div>
                                            <span className="text-2xl font-bold text-gray-800">{t('Female')}</span>
                                        </button>

                                        {/* Male Button */}
                                        <button
                                            type="button"
                                            onClick={() => setTempSelected(1)}
                                            className={`flex-1 flex flex-col items-center justify-center transition-all duration-200 ${tempSelected === 1
                                                    ? 'bg-blue-100'
                                                    : 'bg-white border border-gray-300'
                                                }`}
                                            style={{
                                                width: '240px',
                                                height: '180px',
                                                borderRadius: '16px',
                                                borderWidth: tempSelected === 1 ? '0px' : '1px',
                                                paddingTop: '20px',
                                                paddingRight: '24px',
                                                paddingBottom: '20px',
                                                paddingLeft: '24px'
                                            }}
                                        >
                                            <div className="w-24 h-24 mb-4 flex items-center justify-center">
                                                <MaleIcon className="w-full h-full" />
                                            </div>
                                            <span className="text-2xl font-bold text-gray-800">{t('Male')}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Fixed Footer - Save Button */}
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
                                    {isSaving ? <IonSpinner name="crescent" /> : t('Save')}
                                </IonButton>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GenderUpdateModal;
