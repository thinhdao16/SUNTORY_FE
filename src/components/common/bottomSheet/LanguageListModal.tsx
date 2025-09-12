import React, { useEffect, useMemo, useState } from "react";
import { IonButton, IonIcon } from "@ionic/react";
import { checkmarkCircle, close, code } from "ionicons/icons";
import { motion, AnimatePresence } from "framer-motion";
import { updateAccountInformationV3 } from "@/services/auth/auth-service";
import { UpdateAccountInformationV3Payload } from "@/services/auth/auth-types";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";
import { getListLanguage } from "@/services/language/language-service";
import { useTranslation } from "react-i18next";

interface LanguageListModalProps {
    isOpen: boolean;
    onClose: () => void;
    translateY: number;
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
    showOverlay = true,
}) => {
    const { t } = useTranslation();
    const { i18n } = useTranslation();
    const { refetch } = useAuthInfo();

    const SHEET_MAX_VH = 80;
    const HEADER_PX = 56;

    const [query, setQuery] = useState("");
    const [languages, setLanguages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
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
        const q = query.trim().toLowerCase();
        const list = languages;
        if (!q) return list;
        return list.filter((l) => (l?.name || "").toLowerCase().includes(q));
    }, [languages, query]);

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
            onSelect(tempSelected);
            await handleUpdateUserLanguage(tempSelected);
            await refetch();
            onClose();
        } catch (e) {
            console.error("Error updating language:", e);
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
                    >
                        {/* Header */}
                        <div className="px-2" style={{ minHeight: HEADER_PX, display: "flex", alignItems: "center", touchAction: "none" }}>
                            <div style={{ width: 56, height: HEADER_PX }} />
                            <div
                                style={{
                                    flex: 1,
                                    textAlign: "center",
                                    fontWeight: 700,
                                    lineHeight: 1.2,
                                    wordBreak: "break-word",
                                    overflow: "hidden",
                                }}
                            >
                                {t("My language")}
                            </div>
                            <IonButton
                                fill="clear"
                                onClick={onClose}
                                style={{ width: 56, height: HEADER_PX, outline: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                <IonIcon icon={close} style={{ width: 24, height: 24, color: "#000000" }} />
                            </IonButton>
                        </div>

                        {/* Body */}
                        <div
                            style={{ height: `calc(${SHEET_MAX_VH}vh - ${HEADER_PX}px)`, overflowY: "auto" }}
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
                            <div className="px-2 pt-0 pb-4">
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
                                                    {l?.name}
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
                        </div>
                        {/* Sticky Save at very bottom */}
                        {(tempSelected && tempSelected !== selectedCode) && (
                            <div className="sticky bottom-3 px-4 flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => handleSave()}
                                    className="w-full h-11 rounded-2xl bg-blue-600 text-white font-semibold shadow-md active:opacity-90"
                                >
                                    {t('Save')}
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LanguageListModal;
