import React, { useState, useMemo } from "react";
import { IonButton, IonIcon, IonItem, IonSpinner } from "@ionic/react";
import { close } from "ionicons/icons";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useHealthMasterDataStore } from "@/store/zustand/health-master-data-store";
import { updateHealthConditionV2 } from "@/services/auth/auth-service";
import { UpdateHealthConditionV2Payload } from "@/services/auth/auth-types";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";

interface DietOption {
    id: string;
    name: string;
    description: string;
    icon: string;
}

interface DietLifeStyleModalProps {
    isOpen: boolean;
    onClose: () => void;
    translateY: number;
    handleTouchStart: (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent) => void;
    handleTouchEnd: () => void;
    showOverlay?: boolean;
    currentDiet: number;
}

const DietLifeStyleModal: React.FC<DietLifeStyleModalProps> = ({
    isOpen,
    onClose,
    translateY,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    currentDiet,
    showOverlay = true
}) => {
    const { t } = useTranslation();
    const [selectedDiet, setSelectedDiet] = useState<string>(currentDiet ? String(currentDiet) : '');
    const [isSaving, setIsSaving] = useState(false);
    const { refetch } = useAuthInfo();
    const healthMasterData = useHealthMasterDataStore((state) => state.masterData);
    const dietOptions: DietOption[] = useMemo(() => {
        const group = healthMasterData?.groupedLifestyles?.find(
            (g: any) => g.category?.name === "Diet"
        );

        return group?.lifestyles.map((item: any, index: number) => ({
            id: (item?.id != null && item?.id !== undefined)
                ? String(item.id)
                : String(item.name.toLowerCase().replace(/\s+/g, '-')),
            name: item.name,
            description: item.description || `${item.name} diet for your health journey.`,
            icon: '🥗'
        })) || [];
    }, [healthMasterData]);

    // Khi mở modal hoặc currentDiet thay đổi, tick sẵn theo giá trị hiện tại
    React.useEffect(() => {
        if (isOpen) {
            setSelectedDiet(currentDiet ? String(currentDiet) : '');
        }
    }, [isOpen, currentDiet]);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    const handleRadioChange = (optionId: string) => {
        if (selectedDiet === optionId) {
            setSelectedDiet('');
        } else {
            setSelectedDiet(String(optionId));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload: UpdateHealthConditionV2Payload = {
                weight: null,
                weightUnitId: null,
                allergies: null,
                lifestyleId: selectedDiet ? Number(selectedDiet) : null,
                healthConditions: null,
                height: null,
                heightUnitId: null,
            };
            await updateHealthConditionV2(payload);
            await refetch();
            onClose();
        } catch (error) {
            console.error('Error updating diet:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const SHEET_MAX_VH = 80;
    const HEADER_PX = 56;

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
                        <div className="px-2" style={{ minHeight: HEADER_PX, display: 'flex', alignItems: 'center', touchAction: 'none' }}>
                            <div style={{ width: 56, height: HEADER_PX }} />
                            <div style={{ flex: 1, textAlign: 'center', fontWeight: 700 }}>{t('Your current diet')}</div>
                            <IonButton fill="clear" onClick={onClose} style={{ width: 56, height: HEADER_PX, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                            <div className="flex-1 overflow-y-auto" style={{
                                paddingBottom: '20px',
                                paddingTop: '20px'
                            }}>
                                <div className="px-4">
                                    {/* Diet Options */}
                                    <div className="space-y-3">
                                        {dietOptions.map((option) => (
                                            <IonItem
                                                key={option.id}
                                                lines="none"
                                                className="rounded-xl border border-gray-200 w-full overflow-hidden"
                                                style={{
                                                    '--background': '#ffffff',
                                                    '--min-height': '120px',
                                                    '--padding-start': '16px',
                                                    '--inner-padding-end': '16px',
                                                    '--inner-padding-top': '0px',
                                                    '--inner-padding-bottom': '0px',
                                                } as any}
                                                button={true}
                                                detail={false}
                                                onClick={() => handleRadioChange(option.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        handleRadioChange(option.id);
                                                    }
                                                }}
                                            >
                                                <div className="flex items-center gap-4 py-4 w-full h-full">
                                                    {/* Icon - Larger size */}
                                                    <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-orange-100 flex items-center justify-center text-2xl">
                                                        {option.icon}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-900 text-lg mb-2">
                                                            {t(option.name)}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 leading-relaxed">
                                                            {t(option.description)}
                                                        </p>
                                                    </div>

                                                    {/* Tick - Larger size */}
                                                    <div className="flex-shrink-0">
                                                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${selectedDiet === option.id
                                                            ? 'border-blue-600 bg-blue-600'
                                                            : 'border-gray-300'
                                                            }`}>
                                                            {selectedDiet === option.id && (
                                                                <span className="text-white text-lg">✓</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </IonItem>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Fixed Footer */}
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

export default DietLifeStyleModal;
