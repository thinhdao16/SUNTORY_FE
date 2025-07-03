/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { RefObject } from "react";
import { IonTextarea } from "@ionic/react";
import { IoCopyOutline } from "react-icons/io5";
import MotionBottomSheet from "@/components/common/bottomSheet/MotionBottomSheet";
import LanguageModal from "@/components/common/bottomSheet/LanguageModal";
import TextToSpeechButton from "@/components/common/TextToSpeechButton";
import { ImPaste } from "react-icons/im";
import { MdOutlineSwapHoriz } from "react-icons/md";
import { openSidebarWithAuthCheck } from "@/store/zustand/ui-store";
import NavBarHomeHistoryIcon from "@/icons/logo/nav_bar_home_history.svg?react";
import CloseIcon from "@/icons/logo/chat/x.svg?react";
import DownIcon from "@/icons/logo/translate/down.svg?react";
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
          className={`bg-white darkk:bg-dark-main !rounded-b-4xl overflow-auto px-6`}
          style={{
            height: isKeyboardVisible
              ? `calc(100dvh - ${heightKeyBoard}px - 13%)`
              : "calc(100dvh - 13%)",
            borderRadius: borderRadius,
          }}
        >
          <div className="flex items-start justify-between h-16 mb-2 pt-12">
            <button
              onClick={openSidebarWithAuthCheck}
            >
              <NavBarHomeHistoryIcon aria-label="Menu" />
            </button>
            <span className="font-semibold text-main uppercase tracking-wide">
              {t(`Translate`)}
            </span>
            <button >
              <CloseIcon aria-label={t("close")} />
            </button>
          </div>

          <div className=" items-center flex flex-col border border-netural-200  rounded-2xl">
            <div
              onClick={() => openModal("from")}
              className="border-b border-netural-200 w-full py-3 px-4 flex justify-between items-center cursor-pointer"
            >
              <span className="font-semibold text-main">
                {selectedLanguageFrom.label}
              </span>
              <DownIcon />
            </div>
            <IonTextarea
              autoGrow={true}
              ref={textareaRef}
              rows={1}
              placeholder={t(`Enter text`)}
              value={inputValueTranslate.input}
              onIonInput={(e: any) => handleInputTranslate(e)}
              className=" placeholder:text-gray-500 w-full text-ellipsis resize px-4"
            />
            {false && (
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
            {false && (
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
          <div className="px-5 text-blue-500 mb-4 darkk:text-dark-select-extra bg-blue-100 p-4">
            <div>
              <span className="text-3xl break-words whitespace-pre-line w-full ">
                {inputValueTranslate.output}
              </span>
            </div>

          </div>
          {!isOnline && (
            <div className="bg-red-500 text-white text-center py-2">
              Bạn đang offline. Một số tính năng có thể không hoạt động.
            </div>
          )}
        </div>
        <div className="h-fit p-5">
          <div className="flex justify-between items-center">

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
