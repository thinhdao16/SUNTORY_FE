import React, { useEffect, useMemo, useState } from "react";
import { IonButton, IonIcon, IonSpinner } from "@ionic/react";
import { checkmarkCircle, close, code } from "ionicons/icons";
import { motion, AnimatePresence } from "framer-motion";
import { updateAccountInformationV3 } from "@/services/auth/auth-service";
import { UpdateAccountInformationV3Payload } from "@/services/auth/auth-types";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";
import { getListLanguage } from "@/services/language/language-service";
import { useTranslation } from "react-i18next";
import { useToastStore } from "@/store/zustand/toast-store";

interface LanguageListModalProps {
    isOpen: boolean;
    onClose: () => void;
    translateY: number;
    handleTouchStart: (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent) => void;
    handleTouchEnd: () => void;
    showOverlay?: boolean;
    selectedCode?: string; // ui code like 'en', 'vi', 'zh'
    onSelect: (langCode: string) => void;
}

// Normalize possible backend shape to array
const toArray = (res: any): any[] => (Array.isArray(res) ? res : (res?.data ?? []));

const LanguageListModal: React.FC<LanguageListModalProps> = ({
    isOpen,
    onClose,
    selectedCode,
    onSelect,
    translateY,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    showOverlay = true,
}) => {
    const { t } = useTranslation();
    const { i18n } = useTranslation();
    const { refetch } = useAuthInfo();
    const { showToast } = useToastStore();
    const SHEET_MAX_VH = 80;
    const HEADER_PX = 56;

    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [languages, setLanguages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [tempSelected, setTempSelected] = useState<string | undefined>(selectedCode);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    useEffect(() => {
        if (isOpen) {
            setTempSelected(selectedCode);
            fetchLanguages();
        }
    }, [isOpen, selectedCode]);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const fetchLanguages = async () => {
        setLoading(true);
        try {
            const res = await getListLanguage();
            setLanguages(toArray(res));
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const q = debouncedQuery.trim().toLowerCase();
        const list = languages;
        if (!q) return list;
        return list.filter((l) => (l?.name || "").toLowerCase().includes(q));
    }, [languages, debouncedQuery]);

    // Put ONLY the initially selected language on top (do not change when picking temp)
    const ordered = useMemo(() => {
        const selCode = (selectedCode || '').toLowerCase();
        const list = [...filtered];
        if (!selCode) return list;
        return list.sort((a: any, b: any) => {
            const aCode = (a?.code ?? a?.data?.code ?? '').toLowerCase();
            const bCode = (b?.code ?? b?.data?.code ?? '').toLowerCase();
            const aSel = aCode === selCode ? 1 : 0;
            const bSel = bCode === selCode ? 1 : 0;
            return bSel - aSel; // initially selected first
        });
    }, [filtered, selectedCode]);

    const handleSave = async () => {
        if (!tempSelected || tempSelected === selectedCode) return;
        setIsSaving(true);
        try {
            const lang = languages.find((l) => (l?.code ?? l?.data?.code) === tempSelected);
            if (!lang) return;
            const payload: UpdateAccountInformationV3Payload = {
                languageId: lang?.id ?? lang?.data?.id,
                countryId: null,
                firstName: null,
                lastName: null,
                gender: null,
                yearOfBirth: null,
            };
            await updateAccountInformationV3(payload);
            showToast(t("Language updated successfully!"), 2000, "success");
            onSelect(tempSelected);
            await handleUpdateUserLanguage(tempSelected);
            await refetch();
            onClose();
        } catch (e) {
            console.error("Error updating language:", e);
            showToast(t("Failed to update language. Please try again."), 3000, "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateUserLanguage = async (langCode: string) => {
        // Normalize ui code -> backend code
        let norm = langCode;
        if (norm === 'vn') norm = 'vi';
        if (norm === 'cn') norm = 'zh';

        await i18n.changeLanguage(norm);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={`fixed inset-0 z-[9999] h-full flex justify-center items-end ${showOverlay ? "bg-black/50" : "bg-transparent"}`}
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
                            touchAction: "none",
                            transition: "transform 0.08s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                            willChange: "transform",
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* Header */}
                        <div className="px-2" style={{ minHeight: HEADER_PX, display: "flex", alignItems: "center", touchAction: "none" }}>
                            <div style={{ width: 56, height: HEADER_PX }} />
                            <div className="text-center font-semibold"
                                style={{
                                    flex: 1,
                                    lineHeight: 1.2,
                                    wordBreak: "break-word",
                                    overflow: "hidden",
                                    fontSize: "15px",
                                    color: "black"
                                }}
                            >
                                {t("My language")}
                            </div>
                            <IonButton
                                fill="clear"
                                onClick={() => {
                                    setQuery('');
                                    onClose();
                                }}
                                style={{ width: 56, height: HEADER_PX, outline: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                <IonIcon icon={close} style={{ width: 24, height: 24, color: "#000000" }} />
                            </IonButton>
                        </div>

                        {/* Body (scroll area) */}
                        <div
                            style={{ height: `calc(${SHEET_MAX_VH}vh - ${HEADER_PX}px - 68px)`, overflowY: "auto" }}
                        >
                            {/* Search */}
                            <div className="px-4 pt-1 pb-2">
                                <div className="flex items-center bg-gray-100 rounded-xl px-3 h-11">
                                    <input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={t("Search your language here") as string}
                                        className="flex-1 bg-transparent outline-none text-sm"
                                    />
                                </div>
                            </div>

                            {/* List */}
                            <div className="px-2 pt-0 pb-4 h-140">
                                {loading && (
                                    <div className="px-3 py-3 text-sm text-gray-500">{t('Loading...')}</div>
                                )}
                                {!loading && ordered.map((l, idx) => {
                                    const code = (l?.code ?? l?.data?.code) as string;
                                    const isActive = (tempSelected || selectedCode || '').toLowerCase() === (code || '').toLowerCase();
                                    return (
                                        <React.Fragment key={code || idx}>
                                            <motion.button
                                                initial={{ opacity: 0, translateY: 6 }}
                                                animate={{ opacity: 1, translateY: 0 }}
                                                transition={{ duration: 0.15 }}
                                                type="button"
                                                onClick={() => setTempSelected(code)}
                                                className="w-full flex items-center justify-between px-3 py-3 hover:bg-gray-50 rounded-xl"
                                            >
                                                <span className={`text-[15px] ${isActive ? 'font-semibold' : ''}`}>
                                                    {t(l?.name)}
                                                </span>
                                                {isActive && (
                                                    <IonIcon icon={checkmarkCircle} className="text-blue-500 text-3xl" />
                                                )}
                                            </motion.button>
                                            <div className="mx-3 border-t border-gray-200" />
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                            {/* Spacer to avoid last items hidden behind footer */}
                            <div style={{ height: 68 }} />
                        </div>

                        {/* Fixed Footer outside scroll area */}
                        {(tempSelected && tempSelected !== selectedCode) && (
                            <div className="px-4 py-3 border-t border-gray-100 bg-white">
                                <IonButton
                                    expand="block"
                                    shape="round"
                                    onClick={() => handleSave()}
                                    className="h-12"
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
                    </div>
                </motion.div>
            )}
        </AnimatePresence >
    );
};

export default LanguageListModal;
