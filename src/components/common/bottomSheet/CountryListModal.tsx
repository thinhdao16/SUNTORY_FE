import React, { useEffect, useMemo, useState } from "react";
import { IonButton, IonIcon, IonSpinner } from "@ionic/react";
import { checkmarkCircle, close } from "ionicons/icons";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { getListCountry } from "@/services/country/country-service";
import { Country } from "@/services/country/country-type";
import { updateAccountInformationV3 } from "@/services/auth/auth-service";
import { UpdateAccountInformationV3Payload } from "@/services/auth/auth-types";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";
import { useToastStore } from "@/store/zustand/toast-store";

interface CountryListModalProps {
    isOpen: boolean;
    onClose: () => void;
    translateY: number;
    handleTouchStart: (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent) => void;
    handleTouchEnd: () => void;
    showOverlay?: boolean;
    selectedCode?: string;
    onSelect: (countryCode: string) => void;
}

const CountryListModal: React.FC<CountryListModalProps> = ({ isOpen, onClose, selectedCode, onSelect, translateY, handleTouchStart, handleTouchMove, handleTouchEnd, showOverlay = true }) => {
    const { t } = useTranslation();
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    const SHEET_MAX_VH = 80;
    const HEADER_PX = 56;
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [countries, setCountries] = useState<Country[]>([]);
    const [tempSelected, setTempSelected] = useState<string | undefined>(selectedCode);
    const PAGE_SIZE = 20;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { refetch } = useAuthInfo();
    const { showToast } = useToastStore();  
    useEffect(() => {
        // Reset temp selection each time modal opens with current selection
        if (isOpen) {
            setTempSelected(selectedCode);
            setVisibleCount(PAGE_SIZE);
        }
    }, [isOpen, selectedCode]);

    useEffect(() => {
        fetchCountries();
    }, []);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const fetchCountries = async () => {
        const countries = await getListCountry();
        setCountries(countries.data);
    };

    const filtered = useMemo(() => {
        const q = debouncedQuery.trim().toLowerCase();
        if (!q) return countries;
        return countries.filter((c) => c.name.toLowerCase().includes(q));
    }, [countries, debouncedQuery]);

    // Put ONLY the initially selected country on top (do not change when picking temp)
    const ordered = useMemo(() => {
        const selCode = (selectedCode || '').toLowerCase();
        if (!selCode) return filtered;
        const list = [...filtered];
        return list.sort((a, b) => {
            const aSel = a.code.toLowerCase() === selCode ? 1 : 0;
            const bSel = b.code.toLowerCase() === selCode ? 1 : 0;
            return bSel - aSel; // initially selected first
        });
    }, [filtered, selectedCode]);

    const handleSave = async (tempSelected: string) => {
        setIsSaving(true);
        try {
            const country = countries.find((c) => c.code === tempSelected);
            if (country) {
                const payload: UpdateAccountInformationV3Payload = {
                    countryId: country.id,
                    languageId: null,
                    firstName: null,
                    lastName: null,
                    gender: null,
                    yearOfBirth: null,
                };
                await updateAccountInformationV3(payload);
                showToast(t("Country updated successfully!"), 2000, "success");
                await refetch(); // Cập nhật thông tin user
                onSelect(tempSelected); // Cập nhật state local
                setQuery('');
                onClose();
            }
        } catch (error) {
            console.error('Error updating country:', error);
            showToast(t("Failed to update country. Please try again."), 3000, "error");
        } finally {
            setIsSaving(false);
        }
    };

    // Infinite scroll (progressively reveal items)
    const currentItems = useMemo(() => ordered.slice(0, visibleCount), [ordered, visibleCount]);

    // Load more when scrolled near bottom
    const handleScrollLoadMore = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const threshold = 48; // px from bottom
        if (!isLoadingMore && el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
            if (visibleCount >= ordered.length) return;
            setIsLoadingMore(true);
            // small delay to create smooth loading experience
            setTimeout(() => {
                setVisibleCount((c) => Math.min(ordered.length, c + PAGE_SIZE));
                setIsLoadingMore(false);
            }, 180);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={`fixed inset-0 z-151 h-full flex justify-center items-end ${showOverlay ? 'bg-black/50' : 'bg-transparent'}`}
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
                            <div className="text-center font-semibold text-lg"
                                style={{
                                    flex: 1,
                                    lineHeight: 1.2,
                                    wordBreak: 'break-word',
                                    overflow: 'hidden'
                                }}
                            >
                                {t('My country')}
                            </div>
                            <IonButton
                                fill="clear"
                                onClick={() => {
                                    setQuery('');
                                    onClose();
                                }}
                                style={{ width: 56, height: HEADER_PX, outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <IonIcon icon={close} style={{ width: 24, height: 24, color: '#000000' }} />
                            </IonButton>
                        </div>

                        {/* Scrollable Body */}
                        <div
                            style={{
                                height: `calc(${SHEET_MAX_VH}vh - ${HEADER_PX}px)`,
                                overflowY: 'auto'
                            }}
                            onScroll={handleScrollLoadMore}
                        >
                            {/* Search */}
                            <div className="px-4 pt-1 pb-1">
                                <div className="flex items-center bg-gray-100 rounded-xl px-3 h-11">
                                    <input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={t('Search your country here') as string}
                                        className="flex-1 bg-transparent outline-none text-sm"
                                    />
                                </div>
                            </div>

                            {/* List */}
                            <div className="px-2 pt-0 pb-4 h-160">
                                {currentItems.map((c) => (
                                    <motion.button
                                        initial={{ opacity: 0, translateY: 6 }}
                                        animate={{ opacity: 1, translateY: 0 }}
                                        transition={{ duration: 0.15 }}
                                        key={c.code}
                                        type="button"
                                        onClick={() => setTempSelected(c.code)}
                                        className="w-full flex items-center justify-between px-3 py-3 hover:bg-gray-50 rounded-xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`fi fi-${c.code.toLowerCase()} fis`} style={{ width: 32, height: 32, borderRadius: 9999 }} ></span>
                                            <span className={`${(tempSelected || selectedCode) === c.code ? 'font-semibold' : ''} text-gray-900 text-[15px]`}>{c.name}</span>
                                        </div>
                                        {(tempSelected || selectedCode) === c.code && (
                                            <IonIcon icon={checkmarkCircle} className="text-blue-500 text-3xl" />
                                        )}
                                    </motion.button>
                                ))}

                            </div>
                            {/* Sticky Save inside scroll area, floating like design */}
                            {(tempSelected && tempSelected !== selectedCode) && (
                                <div className="sticky bottom flex justify-center px-4 py-4 border-t border-gray-100">
                                    <IonButton
                                        expand="block"
                                        shape="round"
                                        onClick={() => handleSave(tempSelected!)}
                                        className="h-14"
                                        style={{
                                            '--background': '#1152F4',
                                            '--background-hover': '#2563eb',
                                            'font-weight': '600',
                                            width: '100%',
                                        }}
                                    >
                                        {isSaving ? <IonSpinner name="crescent" /> : t('Save')}
                                    </IonButton>
                                </div>
                            )}
                            {/* Fixed Footer */}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CountryListModal;
