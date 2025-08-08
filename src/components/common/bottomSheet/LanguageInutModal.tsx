import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { close, searchOutline } from "ionicons/icons";
import SelectIcon from "@/icons/logo/translate/selected.svg?react";

interface Language {
    label: string;
    selected: boolean;
    lang: string;
}

interface LanguageSelectModalProps {
    isOpen: boolean;
    translateY: number;
    languagesSocialChat: Language[];
    inputValue: string;
    handleInputSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setInputValue: (value: string) => void;
    onSelect: (lang: string) => void;
    closeModal: () => void;
    handleTouchStart: (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent) => void;
    handleTouchEnd: () => void;
    title?: string;
}

const LanguageSelectModal: React.FC<LanguageSelectModalProps> = ({
    isOpen,
    translateY,
    languagesSocialChat,
    inputValue,
    handleInputSearch,
    setInputValue,
    onSelect,
    closeModal,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    title = "Select Language",
}) => {
    const suggestedLanguages = [ "English", "Vietnamese", "Chinese (Simplified)"];
    const groupByAlphabet = (list: Language[]) => {
        return list.reduce((acc: Record<string, Language[]>, lang) => {
            const letter = lang.label.charAt(0).toUpperCase();
            acc[letter] = acc[letter] || [];
            acc[letter].push(lang);
            return acc;
        }, {});
    };
    const filterAndGroupLanguages = useMemo(() => {
        const filtered = languagesSocialChat.filter(item =>
            item.label.toLowerCase().includes(inputValue.toLowerCase()) ||
            item.lang.toLowerCase().includes(inputValue.toLowerCase())
        );

        if (!inputValue.trim()) {
            const suggested = filtered.filter(lang =>
                suggestedLanguages.some(s => lang.label.toLowerCase().includes(s.toLowerCase()))
            );
            const others = filtered.filter(
                lang => !suggestedLanguages.some(s => lang.label.toLowerCase().includes(s.toLowerCase()))
            );
            const grouped = groupByAlphabet(others);
            return { suggested, grouped, isSearching: false };
        } else {
            return { suggested: [], grouped: groupByAlphabet(filtered), isSearching: true };
        }
    }, [inputValue, languagesSocialChat]);



    const clearSearch = () => setInputValue("");

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) closeModal();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-151 h-full flex justify-center items-end"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleOverlayClick}
                >
                    <div
                        className="bg-success-500 w-full h-[95%] rounded-t-4xl shadow-lg"
                        style={{ transform: `translateY(${translateY}px)`, touchAction: "none" }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="bg-white p-4 rounded-t-4xl">
                            <div className="flex justify-center items-center relative">
                                <span className="font-semibold text-netural-500">{title}</span>
                                <button
                                    className="absolute right-0 top-0 bg-gray-300 p-1 rounded-full"
                                    onClick={closeModal}
                                >
                                    <IonIcon icon={close} className="text-xl text-gray-600" />
                                </button>
                            </div>

                            <div className="mt-4 flex items-center gap-4">
                                <div className="w-full bg-gray-100 flex items-center rounded-xl px-3 py-2 relative">
                                    <IonIcon icon={searchOutline} className="text-gray-500 text-xl mr-2" />
                                    <input
                                        type="text"
                                        placeholder="Search"
                                        value={inputValue}
                                        onChange={handleInputSearch}
                                        className="w-full bg-transparent focus:outline-none"
                                    />
                                    {inputValue && (
                                        <button
                                            onClick={clearSearch}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-500 text-white text-xs w-5 h-5 rounded-full"
                                        >
                                            <IonIcon icon={close} className="text-xs" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="px-4 pb-4 h-full overflow-y-auto">
                            {/* Suggested Languages */}
                            {!filterAndGroupLanguages.isSearching && filterAndGroupLanguages.suggested.length > 0 && (
                                <div className="mb-6">
                                    <span className="uppercase text-gray-500 font-medium my-4 block">
                                        Suggested Languages
                                    </span>
                                    <div className="rounded-2xl bg-white overflow-hidden">
                                        {filterAndGroupLanguages.suggested.map((lang) => (
                                            <div
                                                key={lang.label}
                                                className={`flex items-center cursor-pointer border-b border-gray-100 last:border-b-0 ${lang.selected ? "bg-main text-white" : "hover:bg-gray-50"}`}
                                                onClick={() => {
                                                    onSelect(lang.lang);
                                                    closeModal();
                                                }}
                                            >
                                                <div className="py-3 w-full flex justify-between px-4 font-medium">
                                                    <span>{lang.label}</span>
                                                    {lang.selected && <SelectIcon className="text-white" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Grouped Languages */}
                            {Object.keys(filterAndGroupLanguages.grouped).length > 0 ? (
                                Object.keys(filterAndGroupLanguages.grouped)
                                    .sort()
                                    .map((letter) => (
                                        <div key={letter} className="mb-4">
                                            {!filterAndGroupLanguages.isSearching && (
                                                <div className="mb-2">
                                                    <span className="text-gray-400 font-medium text-sm bg-gray-100 px-2 py-1 rounded">
                                                        {letter}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="rounded-2xl bg-white overflow-hidden">
                                                {filterAndGroupLanguages.grouped[letter].map((lang) => (
                                                    <div
                                                        key={lang.label}
                                                        className={`flex items-center cursor-pointer border-b border-gray-100 last:border-b-0 ${lang.selected ? "bg-main text-white" : "hover:bg-gray-50"}`}
                                                        onClick={() => {
                                                            onSelect(lang.lang);
                                                            closeModal();
                                                        }}
                                                    >
                                                        <div className="py-3 w-full flex justify-between px-4 font-medium">
                                                            <span>{lang.label}</span>
                                                            {lang.selected && <SelectIcon className="text-white" />}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                filterAndGroupLanguages.isSearching && (
                                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                                        <div className="text-4xl mb-2">🔍</div>
                                        <span className="text-sm">No languages found</span>
                                        <span className="text-xs">Try a different search term</span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LanguageSelectModal;
