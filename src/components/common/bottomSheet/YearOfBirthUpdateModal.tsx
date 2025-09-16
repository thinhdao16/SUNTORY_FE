import React, { useEffect, useState } from "react";
import { IonButton, IonIcon, IonSpinner } from "@ionic/react";
import { close } from "ionicons/icons";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { updateAccountInformationV3 } from "@/services/auth/auth-service";
import { UpdateAccountInformationV3Payload } from "@/services/auth/auth-types";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";

interface YearOfBirthUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    translateY: number;
    handleTouchStart: (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent) => void;
    handleTouchEnd: () => void;
    showOverlay?: boolean;
    currentYearOfBirth?: number | null;
}

const YearOfBirthUpdateModal: React.FC<YearOfBirthUpdateModalProps> = ({
    isOpen,
    onClose,
    currentYearOfBirth = null,
    translateY,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    showOverlay = true
}) => {
    const { t } = useTranslation();
    const { refetch } = useAuthInfo();

    const [year, setYear] = useState<string>(currentYearOfBirth ? String(currentYearOfBirth) : "");
    const [isSaving, setIsSaving] = useState(false);

    const SHEET_MAX_VH = 80;
    const HEADER_PX = 56;

    useEffect(() => {
        if (isOpen) {
            setYear(currentYearOfBirth ? String(currentYearOfBirth) : "");
        }
    }, [isOpen, currentYearOfBirth]);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    const currentYear = new Date().getFullYear();
    const yearNum = Number(year);
    const isValidYear =
        year.length === 4 && !Number.isNaN(yearNum) && yearNum >= 1900 && yearNum <= currentYear;

    const hasChanged = (currentYearOfBirth ?? "") !== (isValidYear ? yearNum : ("" as any));

    const handleSave = async () => {
        if (!isValidYear) return;
        setIsSaving(true);
        try {
            const payload: UpdateAccountInformationV3Payload = {
                firstName: null,
                lastName: null,
                countryId: null,
                languageId: null,
                gender: null,
                yearOfBirth: yearNum,
            };
            await updateAccountInformationV3(payload);
            await refetch();
            onClose();
        } catch (error) {
            console.error("Error updating year of birth:", error);
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
                            {/* Left spacer to keep title centered */}
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
                                {t('My year of birth')}
                            </div>
                            <IonButton
                                fill="clear"
                                onClick={onClose}
                                style={{ width: 56, height: HEADER_PX, outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <IonIcon icon={close} style={{ width: 24, height: 24, color: '#000000' }} />
                            </IonButton>
                        </div>

                        {/* Body */}
                        <div
                            style={{
                                height: `calc(${SHEET_MAX_VH}vh - ${HEADER_PX}px)`,
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <div className="px-6 flex-1 flex items-center justify-center">
                                <input
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    type="text"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                                    placeholder={t('Enter year')}
                                    className="w-full max-w-[2800px] mx-auto text-center text-xl font-medium border-0 border-b-2 border-gray-400 focus:border-black focus:outline-none py-3"
                                    autoFocus
                                />
                            </div>

                            {/* Save Button - fixed at bottom */}
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

export default YearOfBirthUpdateModal;