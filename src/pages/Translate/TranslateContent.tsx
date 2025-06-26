/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { RefObject } from "react";
import { Link } from "react-router-dom";
import { IonIcon, IonTextarea } from "@ionic/react";
import { chevronBackOutline, close } from "ionicons/icons";
import { IoCopyOutline } from "react-icons/io5";
import MotionBottomSheet from "@/components/common/bottomSheet/MotionBottomSheet";
import LanguageModal from "@/components/common/bottomSheet/LanguageModal";
import LanguageSelector from "@/components/common/LanguageSelector";
import TextToSpeechButton from "@/components/common/TextToSpeechButton";
import { ImPaste } from "react-icons/im";

interface TranslateContentProps {
  isOpen: boolean;
  scale: number;
  opacity: number;
  borderRadius: string;
  backgroundColor: string;
  isKeyboardVisible: boolean;
  heightKeyBoard: number;
  inputValueTranslate: { input: string; output: string };
  setInputValueTranslate: React.Dispatch<
    React.SetStateAction<{ input: string; output: string }>
  >;
  handleInputTranslate: (e: CustomEvent) => void;
  handleCopyToClipboard: (text: string) => void;
  openModal: (type: string) => void;
  closeModal: () => void;
  swapLanguages: () => void;
  selectedLanguageFrom: { label: string; lang: string };
  selectedLanguageTo: { label: string; lang: string };
  languages: Array<any>;
  languagesTo: Array<any>;
  targetModal: string;
  inputValue: string;
  handleInputSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setInputValue: (value: string) => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  textareaRef: RefObject<HTMLIonTextareaElement | null>;
  toggleLanguage: (type: "from" | "to", lang: string) => void;
  isOnline: boolean;
  translateY: number;
  clipboardHasData: boolean;
  clipboardContent: string | null;
  t: any;
  handlePastContent: () => void;
  modelList: any;
  setModel: (model: string) => void;
  modelDropdown: any;
  modelSelect: string;
}

const TranslateContent: React.FC<TranslateContentProps> = ({
  isOpen,
  scale,
  opacity,
  borderRadius,
  backgroundColor,
  isKeyboardVisible,
  heightKeyBoard,
  inputValueTranslate,
  setInputValueTranslate,
  handleInputTranslate,
  handleCopyToClipboard,
  openModal,
  closeModal,
  swapLanguages,
  selectedLanguageFrom,
  selectedLanguageTo,
  languages,
  languagesTo,
  targetModal,
  inputValue,
  handleInputSearch,
  setInputValue,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  textareaRef,
  toggleLanguage,
  isOnline,
  translateY,
  clipboardHasData,
  t,
  handlePastContent,
  modelList,
  setModel,
  modelDropdown,
  modelSelect,
}) => {
  return (
    <div
      className={`darkk:bg-gray-700 ${isOpen ? "" : "bg-blue-100"}`}
      style={{
        backgroundColor: backgroundColor,
        transition: isOpen ? "none" : "background-color 0.3s ease",
        paddingTop: "var(--safe-area-inset-top)",
      }}
    >
      <MotionBottomSheet
        isOpen={isOpen}
        scale={scale}
        opacity={opacity}
        borderRadius={borderRadius}
      >
        <div
          className={`bg-white darkk:bg-dark-main !rounded-b-4xl overflow-auto`}
          style={{
            height: isKeyboardVisible
              ? `calc(100dvh - ${heightKeyBoard}px - 13%)`
              : "calc(100dvh - 13%)",
            borderRadius: borderRadius,
          }}
        >
          <div className="flex justify-between p-3 pe-5 py-5 sticky z-50 top-0 darkk:bg-dark-main bg-white `}">
            <Link to="/">
              <div className="flex items-center justify-center gap-1">
                <IonIcon icon={chevronBackOutline} className="w-6 h-6" />
                <span>{t(`Home`)}</span>
              </div>
            </Link>
            <div className="flex justify-end gap-2  ">
              <div className="relative" ref={modelDropdown.dropdownRef}>
                <button
                  className=" darkk:text-white cursor-pointer flex items-end border border-gray-300 rounded-md px-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    modelDropdown.toggleDropdown();
                  }}
                >
                  {modelSelect}
                </button>
                <div
                  className={`absolute right-0 mt-2 w-48 bg-white darkk:bg-gray-800 rounded-lg shadow-lg z-10 transition-all duration-300 transform ${modelDropdown.isOpen
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95 pointer-events-none"
                    }`}
                >
                  <ul className="py-2">
                    {modelList.map(
                      (model: {
                        value: string;
                        selected: string;
                        label: string;
                      }) => (
                        <li
                          key={model.value}
                          className={`cursor-pointer p-2 rounded ${model.selected
                            ? "bg-blue-200 text-black darkk:bg-dark-select-extra darkk:text-dark-select-main"
                            : " text-black darkk:text-white"
                            }`}
                          onClick={() => setModel(model.value)}
                        >
                          {model.label}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
              <IonIcon
                icon={close}
                className="text-2xl font-light"
                style={{ "--ionicon-stroke-width": "50px" }}
                onClick={() => {
                  setInputValueTranslate((prev) => ({
                    ...prev,
                    input: "",
                    output: "",
                  }));
                }}
              />
            </div>
          </div>
          <div className="px-5 items-center flex flex-col">
            <IonTextarea
              autoGrow={true}
              ref={textareaRef}
              rows={1}
              placeholder={t(`Enter text`)}
              value={inputValueTranslate.input}
              onIonInput={(e: any) => handleInputTranslate(e)}
              className="!text-3xl placeholder:text-gray-500 w-full text-ellipsis resize !darkk:text-white"
            />
            {clipboardHasData && !inputValueTranslate.input && (
              <div className="items-start flex w-full">
                <button
                  className="bg-blue-200 darkk:bg-dark-select-main darkk:text-dark-select-extra cursor-pointer px-4 py-2 text-2l flex items-center justify-center gap-2 rounded-2xl mt-4"
                  onClick={() => handlePastContent()}
                >
                  <ImPaste />
                  <span>{t("Paste")}</span>
                </button>
              </div>
            )}
            {inputValueTranslate.output && (
              <>
                <div className="flex justify-between items-center w-full py-2 text-gray-700">
                  <TextToSpeechButton
                    text={inputValueTranslate.input}
                    lang={selectedLanguageFrom.lang}
                  />
                  <IoCopyOutline
                    className="text-3xl darkk:text-white"
                    onClick={() =>
                      handleCopyToClipboard(inputValueTranslate.input)
                    }
                  />
                </div>
                <div className="h-0.5 bg-blue-200 darkk:bg-dark-select-main w-[50%] my-3" />
              </>
            )}
          </div>
          {inputValueTranslate.output && (
            <div className="px-5 text-blue-500 mb-4 darkk:text-dark-select-extra">
              <div>
                <span className="text-3xl break-words whitespace-pre-line w-full">
                  {inputValueTranslate.output}
                </span>
              </div>
              <div className="flex justify-between items-center w-full py-2">
                <div>
                  <TextToSpeechButton
                    text={inputValueTranslate.output}
                    lang={selectedLanguageTo.lang}
                  />
                </div>
                <div>
                  <IoCopyOutline
                    className="text-3xl"
                    onClick={() =>
                      handleCopyToClipboard(inputValueTranslate.output)
                    }
                  />
                </div>
              </div>
            </div>
          )}
          {!isOnline && (
            <div className="bg-red-500 text-white text-center py-2">
              Bạn đang offline. Một số tính năng có thể không hoạt động.
            </div>
          )}
        </div>
        <div className="h-fit p-5">
          <LanguageSelector
            selectedLanguageFrom={selectedLanguageFrom}
            selectedLanguageTo={selectedLanguageTo}
            openModal={openModal}
            swapLanguages={swapLanguages}
          />
        </div>
      </MotionBottomSheet>
      <LanguageModal
        isOpen={isOpen}
        translateY={translateY}
        targetModal={targetModal}
        languages={languages}
        languagesTo={languagesTo}
        inputValue={inputValue}
        handleInputSearch={handleInputSearch}
        setInputValue={setInputValue}
        toggleLanguage={toggleLanguage}
        closeModal={closeModal}
        handleTouchStart={handleTouchStart}
        handleTouchMove={handleTouchMove}
        handleTouchEnd={handleTouchEnd}
      />
    </div>
  );
};

export default TranslateContent;
