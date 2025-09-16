import React, { useState, useEffect } from "react";
import { IonButton, IonIcon, IonItem, IonInput, IonChip, IonLabel, IonSpinner } from "@ionic/react";
import { close, paperPlaneOutline } from "ionicons/icons";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useHealthMasterDataStore } from "@/store/zustand/health-master-data-store";
import { updateHealthConditionV2 } from "@/services/auth/auth-service";
import { UpdateHealthConditionV2Payload } from "@/services/auth/auth-types";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";
import { useToastStore } from "@/store/zustand/toast-store";

interface HealthConditionItem {
    healthConditionId: number;
    name: string;
}

interface HealthConditionUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    translateY: number;
    handleTouchStart: (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent) => void;
    handleTouchEnd: () => void;
    showOverlay?: boolean;
    healthConditions: HealthConditionItem[];
}

const HealthConditionUpdateModal: React.FC<HealthConditionUpdateModalProps> = ({
    isOpen,
    onClose,
    translateY,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    healthConditions,
    showOverlay = true
}) => {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState('');
    const [debouncedInputValue, setDebouncedInputValue] = useState('');
    const [isIconSendStyle, setIsIconSendStyle] = useState('black');
    const [savedHealthConditions, setSavedHealthConditions] = useState<HealthConditionItem[]>([]);
    const [selectedHealthConditions, setSelectedHealthConditions] = useState<HealthConditionItem[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchResults, setSearchResults] = useState<HealthConditionItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const healthMasterData = useHealthMasterDataStore((state) => state.masterData);
    const { refetch } = useAuthInfo();
    console.log('healthConditions', savedHealthConditions);
    const showToast = useToastStore.getState().showToast;
    // Mock data - sẽ được thay thế bằng data thật sau
    const mockHealthConditions: HealthConditionItem[] = [
        { healthConditionId: 1, name: 'Peanuts' },
        { healthConditionId: 2, name: 'Shellfish' },
        { healthConditionId: 3, name: 'Dairy' },
        { healthConditionId: 4, name: 'Eggs' },
        { healthConditionId: 5, name: 'Soy' },
        { healthConditionId: 6, name: 'Wheat' },
        { healthConditionId: 7, name: 'Tree Nuts' },
        { healthConditionId: 8, name: 'Fish' }
    ];

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    // Get all health conditions from healthMasterData
    const getAllHealthConditions = (): HealthConditionItem[] => {
        if (!healthMasterData?.groupedHealthConditions) return mockHealthConditions;

        const allHealthConditions: HealthConditionItem[] = [];
        healthMasterData.groupedHealthConditions.forEach((group: any) => {
            group.healthConditions.forEach((healthCondition: any) => {
                allHealthConditions.push({
                    healthConditionId: healthCondition.id,
                    name: healthCondition.name
                });
            });
        });
        return allHealthConditions;
    };

    // Ẩn dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = () => {
            setShowDropdown(false);
        };

        if (showDropdown) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showDropdown]);

    useEffect(() => {
        setSavedHealthConditions(healthConditions);
    }, [healthConditions, isOpen]);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedInputValue(inputValue);
        }, 300);
        return () => clearTimeout(timer);
    }, [inputValue]);

    // Function để search health conditions
    const handleInputChange = (value: string) => {
        setInputValue(value);
        setIsIconSendStyle(value ? 'blue' : 'black');
    };

    // Handle debounced search
    useEffect(() => {
        if (debouncedInputValue) {
            const allHealthConditions = getAllHealthConditions();
            // Filter health conditions dựa trên debounced input
            const filtered = allHealthConditions.filter(healthCondition =>
                healthCondition.name.toLowerCase().includes(debouncedInputValue.toLowerCase()) &&
                !selectedHealthConditions.some(selected => selected.healthConditionId === healthCondition.healthConditionId) &&
                !savedHealthConditions.some(saved => saved.healthConditionId === healthCondition.healthConditionId)
            );
            setSearchResults(filtered.slice(0, 5));
            setShowDropdown(filtered.length > 0);
        } else {
            setSearchResults([]);
            setShowDropdown(false);
        }
    }, [debouncedInputValue, selectedHealthConditions, savedHealthConditions]);

    // Function để chọn từ dropdown
    const selectFromDropdown = (healthConditionItem: HealthConditionItem) => {
        setSelectedHealthConditions(prev => [...prev, healthConditionItem]);
        setInputValue('');
        setShowDropdown(false);
        setSearchResults([]);
        setIsIconSendStyle('black');
    };

    const addAllHealthConditions = () => {
        const value = inputValue.trim();
        if (!value) return;

        const healthConditionNames = new Set(value.split(',').map(name => name.trim()).filter(name => name.length > 0));

        const newHealthConditions: HealthConditionItem[] = [];

        healthConditionNames.forEach(name => {
            const isDuplicate = selectedHealthConditions.some(healthCondition =>
                healthCondition.name.toLowerCase() === name.toLowerCase()
            ) || savedHealthConditions.some(healthCondition =>
                healthCondition.name.toLowerCase() === name.toLowerCase()
            );

            if (!isDuplicate) {
                newHealthConditions.push({
                    healthConditionId: 0,
                    name: name
                });
            }
        });

        if (newHealthConditions.length > 0) {
            setSelectedHealthConditions(prev => [...prev, ...newHealthConditions]);
        }

        setInputValue('');
        setIsIconSendStyle('black');
    };

    const truncateText = (text: string, maxLength: number = 20) => {
        if (!text || text.length <= maxLength) return text || '';
        return text.substring(0, maxLength) + '...';
    };

    const removeSavedHealthCondition = (name: string) => {
        const newSavedHealthConditions = savedHealthConditions.filter(x => x.name !== name);
        setSavedHealthConditions(newSavedHealthConditions);
    };

    const removeSelectedHealthCondition = (name: string) => {
        const newSelectedHealthConditions = selectedHealthConditions.filter(x => x.name !== name);
        setSelectedHealthConditions(newSelectedHealthConditions);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const allHealthConditions = [...selectedHealthConditions, ...savedHealthConditions];
            const payload: UpdateHealthConditionV2Payload = {
                weight: null,
                weightUnitId: null,
                allergies: null,
                lifestyleId: null,
                healthConditions: allHealthConditions,
                height: null,
                heightUnitId: null,
            };
            await updateHealthConditionV2(payload);
            await refetch();
            setSavedHealthConditions([]);
            setSelectedHealthConditions([]);
            showToast(t("Health conditions updated successfully"), 2000, "success");
            onClose();
        } catch (error) {
            showToast(t("Failed to update health conditions. Please try again."), 3000, "error");
            console.error('Error updating health conditions:', error);
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
                            <div className="text-center font-semibold text-lg"
                                style={{
                                    flex: 1,
                                    lineHeight: 1.2,
                                    wordBreak: 'break-word',
                                    overflow: 'hidden'
                                }}
                            >{t('Enter your health conditions')}</div>
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
                                <div className="px-4 space-y-6">
                                    {/* Input */}
                                    <div className="relative">
                                        <IonItem lines="none" className="rounded-xl border border-neutral-200 shadow-sm" style={{ '--background': '#ffffff' } as any}>
                                            <IonInput
                                                value={inputValue}
                                                placeholder={t('e.g., Pregnancy, Diabetes')}
                                                onIonInput={(e) => handleInputChange((e.detail.value ?? '').toString())}
                                                onIonFocus={() => {
                                                    if (debouncedInputValue.trim().length > 0 && searchResults.length > 0) {
                                                        setShowDropdown(true);
                                                    }
                                                }}
                                            />
                                            <IonButton slot="end" fill="clear" onClick={addAllHealthConditions} aria-label="Add health condition">
                                                <IonIcon icon={paperPlaneOutline} className="text-gray-700" style={{ color: isIconSendStyle }} />
                                            </IonButton>
                                        </IonItem>

                                        {/* Dropdown Search Results */}
                                        {showDropdown && searchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 mx-2 max-h-48 overflow-y-auto">
                                                {searchResults.map((healthCondition) => (
                                                    <div
                                                        key={`dropdown-${healthCondition.healthConditionId}`}
                                                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex justify-between items-center"
                                                        onClick={() => selectFromDropdown(healthCondition)}
                                                    >
                                                        <span className="text-gray-900 text-sm">{healthCondition.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Saved from profile */}
                                    {savedHealthConditions.length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold text-black-700 mb-3">{t('Saved from your profile:')}</p>
                                            <div className="flex flex-wrap gap-3 max-h-40 overflow-y-auto pr-2">
                                                {savedHealthConditions.map((healthCondition) => (
                                                    <IonChip
                                                        key={`saved-${healthCondition.healthConditionId}-${healthCondition.name}`}
                                                        className="bg-blue-200"
                                                        style={{
                                                            'color': '#CFDCFD',
                                                            'height': '37px',
                                                            'min-width': '98px',
                                                            'max-width': '200px',
                                                            'radius': '12',
                                                            'align-items': 'center',
                                                            backgroundColor: '#CFDCFD',
                                                            borderRadius: '12px',
                                                            padding: '0 10px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}
                                                    >
                                                        <IonLabel
                                                            className="text-sm text-blue-700"
                                                            style={{
                                                                color: "#000001",
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                minWidth: 0,
                                                                flex: '1 1 auto'
                                                            }}
                                                        >
                                                            {truncateText(healthCondition.name)}
                                                        </IonLabel>
                                                        <IonIcon
                                                            icon={close}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeSavedHealthCondition(healthCondition.name);
                                                            }}
                                                            style={{
                                                                color: '#ef476f',
                                                                marginLeft: 6,
                                                                'align-items': 'center',
                                                                alignItems: 'center',
                                                                cursor: 'pointer',
                                                                flexShrink: 0,
                                                                width: '16px',
                                                                height: '16px',
                                                                fontSize: '16px'
                                                            }}
                                                        />
                                                    </IonChip>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Add new health conditions */}
                                    {(selectedHealthConditions.length > 0) && (
                                        <div>
                                            <p className="text-sm font-semibold text-black-700 mb-3">{t('Add new health conditions:')}</p>
                                            <div className="flex flex-wrap gap-3 max-h-40 overflow-y-auto pr-2">
                                                {selectedHealthConditions.map((healthCondition) => (
                                                    <IonChip
                                                        key={`new-${healthCondition.healthConditionId}-${healthCondition.name}`}
                                                        className="bg-blue-200"
                                                        style={{
                                                            'color': '#CFDCFD',
                                                            'height': '37px',
                                                            'min-width': '98px',
                                                            'max-width': '200px',
                                                            'radius': '12',
                                                            'align-items': 'center',
                                                            backgroundColor: '#CFDCFD',
                                                            borderRadius: '12px',
                                                            padding: '0 10px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}
                                                    >
                                                        <IonLabel
                                                            className="text-sm text-blue-700"
                                                            style={{
                                                                color: "#000001",
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                minWidth: 0,
                                                                flex: '1 1 auto'
                                                            }}
                                                        >
                                                            {truncateText(healthCondition.name)}
                                                        </IonLabel>
                                                        <IonIcon
                                                            icon={close}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeSelectedHealthCondition(healthCondition.name);
                                                            }}
                                                            style={{
                                                                color: '#ef476f',
                                                                marginLeft: 6,
                                                                'align-items': 'center',
                                                                alignItems: 'center',
                                                                cursor: 'pointer',
                                                                flexShrink: 0,
                                                                width: '16px',
                                                                height: '16px',
                                                                fontSize: '16px'
                                                            }}
                                                        />
                                                    </IonChip>
                                                ))}
                                            </div>
                                        </div>
                                    )}
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

export default HealthConditionUpdateModal;
