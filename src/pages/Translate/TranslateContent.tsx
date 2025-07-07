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
import SwapIcon from "@/icons/logo/translate/swap.svg?react";
import EmotionModal from "@/components/common/bottomSheet/EmotionModal";
import SparkleIcon from "@/icons/logo/translate/sparkle.svg?react";
import PlusIcon from "@/icons/logo/translate/plus.svg?react";
import PlusIconNothing from "@/icons/logo/translate/plus_nothing.svg?react";

interface TranslateContentProps {
  isOpen: { emotion: boolean; language: boolean };
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
  openModal: (target: string, type: string) => void;
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
  const [emotionData, setEmotionData] = useState<{
    emotions: { icon: string; label: string }[];
    context: string[];
  } | null>(null);
  // Hàm xử lý khi confirm modal
  const handleEmotionConfirm = (data: { emotions?: { icon: string; label: string }[]; context: string[] }) => {
    console.log(data)
    if ((data.emotions && data.emotions.length !== 0) || data.context.length !== 0) {
      setEmotionData({
        emotions: data.emotions ?? [],
        context: data.context,
      });
    } else {
      setEmotionData(null);

    }
  };
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
        isOpen={isOpen.emotion || isOpen.language}
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
          <div className="flex flex-col gap-6">
            {emotionData ? (
              <div className="rounded-2xl bg-[#F1F5FF]">
                <div className="flex items-center justify-between px-4 pt-3 pb-2 rounded-t-2xl bg-[#1557F5]">
                  <span className="font-semibold text-white">{t("Translate")}</span>
                  <span className="flex items-center gap-1">
                    <SparkleIcon className="w-5 h-5 text-white" />
                    <PlusIcon
                      className="w-5 h-5 text-white cursor-pointer"
                      onClick={() => openModal("", "emotion")}
                    />
                  </span>
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    {emotionData.emotions.map((e, idx) => (
                      <span key={idx} className="flex items-center gap-1">
                        <span className="text-2xl">{e?.icon}</span>
                        <span className="text-gray-700">{e?.label}</span>
                        {idx < emotionData.emotions.length - 1 && <span>,</span>}
                      </span>
                    ))}
                  </div>
                  <div className="text-gray-600 border-t pt-2">{emotionData.context}</div>
                </div>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 border rounded-2xl px-4 py-2  justify-between"
                onClick={() => openModal("", "emotion")}
              >
                <span className="font-semibold text-[#1557F5]">{t("Translate")}</span>
                <PlusIconNothing />
              </div>
            )}
            <div className=" items-center flex flex-col border border-netural-200  rounded-2xl ">
              <div
                onClick={() => openModal("from", "language")}
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
                className=" placeholder:text-gray-500 w-full text-ellipsis resize px-4 !min-h-[85px] !max-h-[200px] overflow-y-auto focus:!outline-0"
                style={{
                  border: "none",
                  boxShadow: "none",
                  "--highlight-color-focused": "none",
                } as React.CSSProperties}
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
            <div className="flex items-center gap-4">
              <div className="flex-grow border-t border-netural-300"></div>
              <SwapIcon
                onClick={swapLanguages}
              />
              <div className="flex-grow border-t border-netural-300"></div>
            </div>

            {!isOnline && (
              <div className="bg-red-500 text-white text-center py-2">
                Bạn đang offline. Một số tính năng có thể không hoạt động.
              </div>
            )}
            <div className=" items-center flex flex-col border border-netural-200  rounded-2xl  bg-chat-to">
              <div
                onClick={() => openModal("to", "language")}
                className="border-b border-netural-200 w-full py-3 px-4 flex justify-between items-center cursor-pointer"
              >
                <span className="font-semibold text-main">
                  {selectedLanguageTo.label}
                </span>
                <DownIcon />
              </div>
              <IonTextarea
                autoGrow={true}
                ref={textareaRef}
                rows={1}
                value={inputValueTranslate.output}
                onIonInput={(e: any) => handleInputTranslate(e)}
                className=" placeholder:text-gray-500 w-full text-ellipsis resize px-4 !min-h-[85px] overflow-y-auto focus:!outline-0"
                style={{
                  border: "none",
                  boxShadow: "none",
                  "--highlight-color-focused": "none",
                } as React.CSSProperties}
                disabled
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
                      text={inputValueTranslate.output}
                      lang={selectedLanguageFrom.lang}
                    />
                    <IoCopyOutline
                      className="text-3xl darkk:text-white"
                      onClick={() =>
                        handleCopyToClipboard(inputValueTranslate.output)
                      }
                    />
                  </div>
                  <div className="h-0.5 bg-blue-200 darkk:bg-dark-select-main w-[50%] my-3" />
                </>
              )}
            </div>
          </div>


        </div>

      </MotionBottomSheet>
      <LanguageModal
        isOpen={isOpen.language}
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
      <EmotionModal
        isOpen={isOpen.emotion}
        translateY={translateY}
        onClose={closeModal}
        handleTouchStart={handleTouchStart}
        handleTouchMove={handleTouchMove}
        handleTouchEnd={handleTouchEnd}
        onConfirm={handleEmotionConfirm}
      />
    </div>
  );
};

export default TranslateContent;
