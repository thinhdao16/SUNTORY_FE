import React from "react";
import { MdOutlineSwapHoriz } from "react-icons/md";

interface LanguageSelectorProps {
  selectedLanguageFrom: { label: string };
  selectedLanguageTo: { label: string };
  openModal: (type: string) => void;
  swapLanguages: () => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguageFrom,
  selectedLanguageTo,
  openModal,
  swapLanguages,
}) => {
  return (
    <div className="flex justify-between items-center">
      <button
        onClick={() => openModal("from")}
        className="w-[35%] py-4 bg-white rounded-xl text-sm darkk:bg-dark-main"
      >
        {selectedLanguageFrom.label}
      </button>
      <MdOutlineSwapHoriz
        className="text-3xl text-gray-700 cursor-pointer darkk:text-white"
        onClick={swapLanguages}
      />
      <button
        onClick={() => openModal("to")}
        className="w-[35%] py-4 bg-white rounded-xl text-sm darkk:bg-dark-main"
      >
        {selectedLanguageTo.label}
      </button>
    </div>
  );
};

export default LanguageSelector;
