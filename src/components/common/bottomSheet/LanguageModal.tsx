import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  close,
  searchOutline,
} from "ionicons/icons";
import SelectIcon from "@/icons/logo/translate/selected.svg?react"
interface LanguageModalProps {
  isOpen: boolean;
  translateY: number;
  targetModal: string;
  languages: Array<{ label: string; selected: boolean; lang: string }>;
  languagesTo: Array<{ label: string; selected: boolean; lang: string }>;
  inputValue: string;
  handleInputSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setInputValue: (value: string) => void;
  toggleLanguage: (type: "from" | "to", lang: string) => void;
  closeModal: () => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
}

const LanguageModal: React.FC<LanguageModalProps> = ({
  isOpen,
  translateY,
  targetModal,
  languages,
  languagesTo,
  inputValue,
  handleInputSearch,
  setInputValue,
  toggleLanguage,
  closeModal,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
}) => {
  const suggestedLanguages = ["Detect language", "English", "Vietnamese", "Chinese (Simplified)"];

  const filterAndGroupLanguages = (searchKeyword: string, isFrom: boolean, languages: any[], languagesTo: any[]) => {
    const list = isFrom ? languages : languagesTo;
    const filtered = list.filter(item =>
      item.label.toLowerCase().includes((searchKeyword || '').toLowerCase()) ||
      item.lang.toLowerCase().includes((searchKeyword || '').toLowerCase())
    );

    if (!searchKeyword || searchKeyword.trim() === '') {
      const suggested = filtered.filter(lang =>
        suggestedLanguages.some(suggLang => {
          const normalizedSuggested = suggLang.toLowerCase();
          const normalizedLangLabel = lang.label.toLowerCase();
          const normalizedLangName = lang.lang.toLowerCase();

          return normalizedLangLabel.includes(normalizedSuggested) ||
            normalizedLangName.includes(normalizedSuggested) ||
            normalizedLangLabel.includes('detect') && normalizedSuggested.includes('detect') ||
            normalizedLangLabel.includes('english') && normalizedSuggested.includes('english') ||
            normalizedLangLabel.includes('vietnamese') && normalizedSuggested.includes('vietnamese') ||
            normalizedLangLabel.includes('chinese') && normalizedSuggested.includes('chinese');
        })
      );

      const others = filtered.filter(lang =>
        !suggestedLanguages.some(suggLang => {
          const normalizedSuggested = suggLang.toLowerCase();
          const normalizedLangLabel = lang.label.toLowerCase();
          const normalizedLangName = lang.lang.toLowerCase();

          return normalizedLangLabel.includes(normalizedSuggested) ||
            normalizedLangName.includes(normalizedSuggested) ||
            normalizedLangLabel.includes('detect') && normalizedSuggested.includes('detect') ||
            normalizedLangLabel.includes('english') && normalizedSuggested.includes('english') ||
            normalizedLangLabel.includes('vietnamese') && normalizedSuggested.includes('vietnamese') ||
            normalizedLangLabel.includes('chinese') && normalizedSuggested.includes('chinese');
        })
      );

      const groupedOthers = others.reduce((groups: any, lang: any) => {
        const firstLetter = lang.label.charAt(0).toUpperCase();
        if (!groups[firstLetter]) {
          groups[firstLetter] = [];
        }
        groups[firstLetter].push(lang);
        return groups;
      }, {});

      Object.keys(groupedOthers).forEach(letter => {
        groupedOthers[letter].sort((a: any, b: any) => a.label.localeCompare(b.label));
      });

      return {
        suggested,
        grouped: groupedOthers,
        isSearching: false
      };
    } else {
      const groupedSearch = filtered.reduce((groups: any, lang: any) => {
        const firstLetter = lang.label.charAt(0).toUpperCase();
        if (!groups[firstLetter]) {
          groups[firstLetter] = [];
        }
        groups[firstLetter].push(lang);
        return groups;
      }, {});

      Object.keys(groupedSearch).forEach(letter => {
        groupedSearch[letter].sort((a: any, b: any) => a.label.localeCompare(b.label));
      });

      return {
        suggested: [],
        grouped: groupedSearch,
        isSearching: true
      };
    }
  };

  const isFrom = useMemo(() => {
    return targetModal === "from";
  }, [targetModal]);

  const { suggested, grouped, isSearching } = useMemo(() => {
    return filterAndGroupLanguages(inputValue, isFrom, languages, languagesTo);
  }, [targetModal, inputValue, languages, languagesTo]);

  const onChangeInputSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputSearch(e);
  };

  const clearSearch = () => {
    setInputValue("");
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
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
            className="bg-success-500 darkk:bg-dark-extra w-full h-[95%] rounded-t-4xl shadow-lg transition-transform duration-300 ease-out"
            style={{
              transform: `translateY(${translateY}px)`,
              touchAction: "none",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white p-4 rounded-t-4xl">
              <div className="flex justify-center items-center relative">
                <span className="font-semibold text-netural-500">
                  {isFrom ? t("TRANSLATE FROM") : t("TRANSLATE TO")}
                </span>
                <button
                  className="absolute right-0 top-0 bg-gray-300 darkk:bg-dark-extra p-1 rounded-full flex items-center justify-center"
                  onClick={closeModal}
                >
                  <IonIcon
                    icon={close}
                    className="text-xl text-gray-600 darkk:text-white"
                  />
                </button>
              </div>
              <div className="mt-4 flex justify-between items-center gap-4">
                <div className="w-full bg-gray-100 flex items-center rounded-xl px-3 py-2 relative">
                  <IonIcon
                    icon={searchOutline}
                    className="text-gray-500 text-xl mr-2"
                  />
                  <input
                    type="text"
                    placeholder={t("Search")}
                    value={inputValue}
                    onChange={onChangeInputSearch}
                    className="w-full focus:outline-none bg-transparent"
                  />
                  {inputValue && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                    >
                      <IonIcon icon={close} className="text-xs" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="px-4 pb-4 h-full overflow-y-auto">
              {/* Suggested Languages - chỉ hiển thị khi không search */}
              {!isSearching && suggested.length > 0 && (
                <div className="mb-6">
                  <span className="uppercase text-gray-500  font-medium my-4 block">
                    {t("SUGGESTED LANGUAGES")}
                  </span>
                  <div className="rounded-2xl bg-white overflow-hidden">
                    {suggested.map((lang, index) => (
                      <div
                        key={lang.label}
                        className={`flex items-center w-full cursor-pointer border-b border-gray-100 last:border-b-0 ${lang.selected ? "bg-main text-white" : "hover:bg-gray-50"
                          }`}
                        onClick={() => {
                          toggleLanguage(isFrom ? "from" : "to", lang.lang);
                          closeModal();
                        }}
                      >
                        <div className="py-3 w-full flex items-center justify-between px-4 font-medium">
                          <span>{lang.label}</span>
                          {lang.selected && <SelectIcon className="text-white" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results hoặc Alphabetical Groups */}
              {Object.keys(grouped).length > 0 ? (
                Object.keys(grouped)
                  .sort()
                  .map((letter) => (
                    <div key={letter} className="mb-4">
                      {!isSearching && (
                        <div className="flex items-center mb-2">
                          <span className="text-gray-400 font-medium text-sm bg-gray-100 px-2 py-1 rounded">
                            {letter}
                          </span>
                        </div>
                      )}
                      <div className="rounded-2xl bg-white overflow-hidden">
                        {grouped[letter].map((lang: any, index: number) => (
                          <div
                            key={lang.label}
                            className={`flex items-center w-full cursor-pointer border-b border-gray-100 last:border-b-0 ${lang.selected ? "bg-main text-white" : "hover:bg-gray-50"
                              }`}
                            onClick={() => {
                              toggleLanguage(isFrom ? "from" : "to", lang.lang);
                              closeModal();
                            }}
                          >
                            <div className="py-3 w-full flex items-center justify-between px-4 font-medium">
                              <span>{lang.label}</span>
                              {lang.selected && <SelectIcon className="text-white" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              ) : (
                isSearching && (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🔍</div>
                    <span className="text-sm">{t("No languages found")}</span>
                    <span className="text-xs">{t("Try a different search term")}</span>
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

export default LanguageModal;
