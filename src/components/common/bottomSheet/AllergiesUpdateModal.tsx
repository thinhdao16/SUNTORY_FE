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

interface AllergyItem {
    allergyId: number;
    name: string;
}

interface AllergiesUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    translateY: number;
    handleTouchStart: (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent) => void;
    handleTouchEnd: () => void;
    showOverlay?: boolean;
    allergies: AllergyItem[];
}

const AllergiesUpdateModal: React.FC<AllergiesUpdateModalProps> = ({
    isOpen,
    onClose,
    translateY,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    allergies,
    showOverlay = true
}) => {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState('');
    const [debouncedInputValue, setDebouncedInputValue] = useState('');
    const [isIconSendStyle, setIsIconSendStyle] = useState('black');
    const [savedAllergies, setSavedAllergies] = useState<AllergyItem[]>([]);
    const [selectedAllergies, setSelectedAllergies] = useState<AllergyItem[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchResults, setSearchResults] = useState<AllergyItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const healthMasterData = useHealthMasterDataStore((state) => state.masterData);
    const { refetch } = useAuthInfo();
    const showToast = useToastStore.getState().showToast;
    // Mock data - sẽ được thay thế bằng data thật sau
    const mockAllergies: AllergyItem[] = [
        { allergyId: 1, name: 'Peanuts' },
        { allergyId: 2, name: 'Shellfish' },
        { allergyId: 3, name: 'Dairy' },
        { allergyId: 4, name: 'Eggs' },
        { allergyId: 5, name: 'Soy' },
        { allergyId: 6, name: 'Wheat' },
        { allergyId: 7, name: 'Tree Nuts' },
        { allergyId: 8, name: 'Fish' }
    ];

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    // Get all allergies from healthMasterData
    const getAllAllergies = (): AllergyItem[] => {
        if (!healthMasterData?.groupedAllergies) return mockAllergies;

        const allAllergies: AllergyItem[] = [];
        healthMasterData.groupedAllergies.forEach((group: any) => {
            group.allergies.forEach((allergy: any) => {
                allAllergies.push({
                    allergyId: allergy.id,
                    name: allergy.name
                });
            });
        });
        return allAllergies;
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
        setSavedAllergies(allergies);
    }, [allergies]);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedInputValue(inputValue);
        }, 300);
        return () => clearTimeout(timer);
    }, [inputValue]);

    // Function để search allergies
    const handleInputChange = (value: string) => {
        setInputValue(value);
        setIsIconSendStyle(value ? 'blue' : 'black');
    };

    // Handle debounced search
    useEffect(() => {
        if (debouncedInputValue) {
            const allAllergies = getAllAllergies();
            // Filter allergies dựa trên debounced input
            const filtered = allAllergies.filter(allergy =>
                allergy.name.toLowerCase().includes(debouncedInputValue.toLowerCase()) &&
                !selectedAllergies.some(selected => selected.allergyId === allergy.allergyId) &&
                !savedAllergies.some(saved => saved.allergyId === allergy.allergyId)
            );
            setSearchResults(filtered.slice(0, 5));
            setShowDropdown(filtered.length > 0);
        } else {
            setSearchResults([]);
            setShowDropdown(false);
        }
    }, [debouncedInputValue, selectedAllergies, savedAllergies]);

    // Function để chọn từ dropdown
    const selectFromDropdown = (allergyItem: AllergyItem) => {
        setSelectedAllergies(prev => [...prev, allergyItem]);
        setInputValue('');
        setShowDropdown(false);
        setSearchResults([]);
        setIsIconSendStyle('black');
    };

    const addAllergy = () => {
        const value = inputValue.trim();
        if (!value) return;

        const allergyNames = new Set(value.split(',').map(name => name.trim()).filter(name => name.length > 0));

        const newAllergies: AllergyItem[] = [];

        allergyNames.forEach(name => {
            const isDuplicate = selectedAllergies.some(allergy =>
                allergy.name.toLowerCase() === name.toLowerCase()
            ) || savedAllergies.some(allergy =>
                allergy.name.toLowerCase() === name.toLowerCase()
            );

            if (!isDuplicate) {
                newAllergies.push({
                    allergyId: 0,
                    name: name
                });
            }
        });

        if (newAllergies.length > 0) {
            setSelectedAllergies(prev => [...prev, ...newAllergies]);
        }

        setInputValue('');
        setIsIconSendStyle('black');
    };

    const truncateText = (text: string, maxLength: number = 20) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const removeSavedAllergy = (name: string) => {
        const newSavedAllergies = savedAllergies.filter(x => x.name !== name);
        setSavedAllergies(newSavedAllergies);
    };

    const removeSelectedAllergy = (name: string) => {
        const newSelectedAllergies = selectedAllergies.filter(x => x.name !== name);
        setSelectedAllergies(newSelectedAllergies);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const allAllergies = [...selectedAllergies, ...savedAllergies];
            const payload: UpdateHealthConditionV2Payload = {
                weight: null,
                weightUnitId: null,
                allergies: allAllergies,
                lifestyleId: null,
                healthConditions: null,
                height: null,
                heightUnitId: null,
            };
            await updateHealthConditionV2(payload);
            await refetch();
            setSavedAllergies([]);
            setSelectedAllergies([]);
            showToast(t("Allergies updated successfully"), 2000, "success");
            onClose();
        } catch (error) {
            console.error('Error updating allergies:', error);
            showToast(t("Failed to update allergies. Please try again."), 3000, "error");
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
                                {t('Enter your food allergies')}
                            </div>
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
                                                placeholder={t('e.g., Peanuts, Shellfish')}
                                                onIonInput={(e) => handleInputChange((e.detail.value ?? '').toString())}
                                                onIonFocus={() => {
                                                    if (debouncedInputValue.trim().length > 0 && searchResults.length > 0) {
                                                        setShowDropdown(true);
                                                    }
                                                }}
                                            />
                                            <IonButton slot="end" fill="clear" onClick={addAllergy} aria-label="Add allergy">
                                                <IonIcon icon={paperPlaneOutline} className="text-gray-700 h-5 w-5" style={{ color: isIconSendStyle }} />
                                            </IonButton>
                                        </IonItem>

                                        {/* Dropdown Search Results */}
                                        {showDropdown && searchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 mx-2 max-h-48 overflow-y-auto">
                                                {searchResults.map((allergy) => (
                                                    <div
                                                        key={`dropdown-${allergy.allergyId}`}
                                                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex justify-between items-center"
                                                        onClick={() => selectFromDropdown(allergy)}
                                                    >
                                                        <span className="text-gray-900 text-sm">{allergy.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Saved from profile */}
                                    {savedAllergies.length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold text-black-700 mb-3">{t('Saved from your profile:')}</p>
                                            <div className="flex flex-wrap gap-3 max-h-40 overflow-y-auto pr-2">
                                                {savedAllergies.map((allergy) => (
                                                    <IonChip
                                                        key={`saved-${allergy.allergyId}-${allergy.name}`}
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
                                                            {truncateText(allergy.name)}
                                                        </IonLabel>
                                                        <IonIcon
                                                            icon={close}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeSavedAllergy(allergy.name);
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

                                    {/* Add new allergies */}
                                    {(selectedAllergies.length > 0) && (
                                        <div>
                                            <p className="text-sm font-semibold text-black-700 mb-3">{t('Add new allergies:')}</p>
                                            <div className="flex flex-wrap gap-3 max-h-40 overflow-y-auto pr-2">
                                                {selectedAllergies.map((allergy) => (
                                                    <IonChip
                                                        key={`new-${allergy.allergyId}-${allergy.name}`}
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
                                                            {truncateText(allergy.name)}
                                                        </IonLabel>
                                                        <IonIcon
                                                            icon={close}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeSelectedAllergy(allergy.name);
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

export default AllergiesUpdateModal;
