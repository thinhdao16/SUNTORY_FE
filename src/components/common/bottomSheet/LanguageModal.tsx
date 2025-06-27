import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  close,
  searchOutline,
  languageOutline,
  checkmarkOutline,
} from "ionicons/icons";

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

  const [keyword, setKeyword] = useState<string>('');

  const filterLanguages = (keyword: string, isFrom: boolean, languages: any[], languagesTo: any[]) => {
    const list = isFrom ? languages : languagesTo;
    return list.filter(item =>
      item.label.toLowerCase().includes((keyword || '').toLowerCase()) ||
      item.lang.toLowerCase().includes((keyword || '').toLowerCase())
    );
  };

  const isFrom = useMemo(() => {
    return targetModal === "from";
  }, [targetModal]);

  const validLanguage = useMemo(() => {
    return filterLanguages(keyword, isFrom, languages, languagesTo);
  }, [targetModal, keyword, languages, languagesTo]);

  const onChangeInputSearch = (e: any) => {
    setKeyword(e.target.value);
    handleInputSearch(e);
  }

  useEffect(() => {
    return () => {
      setKeyword('');
    }
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-151 h-full flex justify-center items-end"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="bg-blue-50 darkk:bg-dark-extra w-full h-[95%] rounded-t-lg shadow-lg transition-transform duration-300 ease-out"
            style={{
              transform: `translateY(${translateY}px)`,
              touchAction: "none",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="bg-white darkk:bg-dark-main p-4">
              <div className="flex justify-center items-center relative">
                <span className="font-semibold">{isFrom ? t(`Translate from`) : t(`Translate to`)}</span>
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
                <div className="w-full bg-gray-200 darkk:bg-dark-extra flex items-center rounded-xl p-1.5 relative">
                  <IonIcon
                    slot="start"
                    icon={searchOutline}
                    aria-hidden="true"
                    className="text-gray-500 text-xl mr-2"
                  />
                  <input
                    type="text"
                    placeholder={t(`Search`)}
                    value={inputValue}
                    onChange={onChangeInputSearch}
                    className="w-full focus:outline-none relative"
                  />
                  {inputValue && (
                    <IonIcon
                      icon={close}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-500 text-white text-sm p-0.5 rounded-full flex items-center justify-center cursor-pointer"
                      onClick={() => setInputValue("")}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="p-4">
              <div>
                <span className="uppercase text-gray-500 text-sm">
                  {t(`Language`)}
                </span>
                <div className="rounded-lg mt-2 ">
                  <div className="rounded-2xl">
                    {validLanguage.map(
                      (lang, index) => (
                        <div
                          key={lang.label}
                          className={`flex items-center justify-center gap-2 w-full ${lang.selected
                            ? "bg-blue-200 text-gray-700 darkk:bg-dark-select-main darkk:text-white"
                            : "bg-white text-gray-500 darkk:bg-dark-main darkk:text-white"
                            } ${index === 0
                              ? "rounded-t-lg"
                              : index === validLanguage.length - 1
                                ? "rounded-b-lg"
                                : ""
                            }`}
                          onClick={() => {
                            toggleLanguage(isFrom ? "from" : "to", lang.lang);
                            closeModal();
                          }}
                        >
                          <IonIcon
                            icon={languageOutline}
                            className="text-2xl pl-4 pr-2 py-3"
                          />
                          <div className="py-3 w-full flex items-center justify-between pr-4">
                            <span>{lang.label}</span>
                            {lang.selected && (
                              <IonIcon
                                icon={checkmarkOutline}
                                className="text-xl"
                              />
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LanguageModal;
