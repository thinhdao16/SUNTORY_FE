/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { RefObject, useState } from "react";
import { IonTextarea } from "@ionic/react";
import { IoCopyOutline } from "react-icons/io5";
import MotionBottomSheet from "@/components/common/bottomSheet/MotionBottomSheet";
import LanguageModal from "@/components/common/bottomSheet/LanguageModal";
import CloseIcon from "@/icons/logo/close.svg?react";
import HistoryIcon from "@/icons/logo/translate/history.svg?react";
import DownIcon from "@/icons/logo/translate/down.svg?react";
import SwapIcon from "@/icons/logo/translate/swap.svg?react";
import SwapDetectedIcon from "@/icons/logo/translate/swap.svg?react";
import EmotionModal from "@/components/common/bottomSheet/EmotionModal";
import SparkleIcon from "@/icons/logo/translate/sparkle.svg?react";
import PlusIcon from "@/icons/logo/translate/plus.svg?react";
import SettingsIcon from "@/icons/logo/translate/settings.svg?react"
import { TranslationResult } from "@/store/zustand/translation-store";
import { GoPaste } from "react-icons/go";
import ReactMarkdown from 'react-markdown';
import { useHistory } from "react-router-dom";
import BackIcon from "@/icons/logo/vector_left.svg?react";

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
  selectedLanguageFrom: { label: string; lang: string; code: number | null };
  selectedLanguageTo: { label: string; lang: string; code: number };
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
  setEmotionData: React.Dispatch<
    React.SetStateAction<{
      emotions: { icon: string; label: string }[];
      context: string[];
    } | null>
  >;
  emotionData: {
    emotions: { icon: string; label: string }[];
    context: string[];
  } | null;
  handleTranslateAI: () => void;
  isTranslating?: boolean;
  translationResult?: TranslationResult | null;
  isReverseCollapsed?: boolean;
  setIsReverseCollapsed?: React.Dispatch<React.SetStateAction<boolean>>;
  isAiInsightsCollapsed?: boolean;
  setIsAiInsightsCollapsed?: React.Dispatch<React.SetStateAction<boolean>>;
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
  setEmotionData,
  emotionData,
  handleTranslateAI,
  isTranslating = false,
  translationResult,
  isReverseCollapsed = false,
  setIsReverseCollapsed = () => { },
  isAiInsightsCollapsed = false,
  setIsAiInsightsCollapsed = () => { },
}) => {
  const history = useHistory();

  const [emotionInput, setEmotionInput] = useState(undefined as string | undefined);
  const [context, setContext] = useState("");
  const [selected, setSelected] = useState<string[]>([]);


  const handleEmotionConfirm = (data: { emotions?: { icon: string; label: string }[]; context: string[] }) => {
    if ((data.emotions && data.emotions.length !== 0) || data.context.length !== 0) {
      setEmotionData({
        emotions: data.emotions ?? [],
        context: data.context,
      });
    } else {
      setEmotionData(null);
    }
  };

  const removeEmotionRow = () => {
    if (!emotionData) return;
    setEmotionData({
      ...emotionData,
      emotions: [],
    });
    if (emotionData.context.length === 0) {
      setEmotionData(null);
    }
    setEmotionInput("");
    setSelected([]);
  };

  const removeContextRow = () => {
    if (!emotionData) return;
    setEmotionData({
      ...emotionData,
      context: [],
    });
    if (emotionData.emotions.length === 0) {
      setEmotionData(null);
    }
    setContext("");
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
          className={`bg-white darkk:bg-dark-main !rounded-b-4xl pb-4`}
          style={{
            height: isKeyboardVisible
              ? `calc(100dvh  - 13vh)`
              : "calc(100dvh - 13%)",
            borderRadius: borderRadius,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className="relative flex items-center justify-between px-6 h-[50px]">
            <button onClick={() => history.goBack()} aria-label="Back">
              <BackIcon className="text-blue-600" />
            </button>
            <span className="font-semibold text-main uppercase tracking-wide">
              {t(`Translate`)}
            </span>
            <button onClick={() => history.replace("/translate/history", { history: true })} >
              <HistoryIcon aria-label={t("history")} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden max-h-[85dvh] px-6 pt-10">
            <div className="flex flex-col gap-6 pb-6">
              {emotionData ? (
                <div className="rounded-2xl bg-chat-to">
                  <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-main"
                    onClick={() => openModal("", "emotion")}
                  >
                    <span className="font-semibold text-white">{t("Translate with AI using context")}</span>
                    <span className="flex items-center gap-1">
                      <SparkleIcon className="w-5 h-5 text-white" />
                      <PlusIcon
                        className="w-5 h-5 text-white cursor-pointer"
                      />
                    </span>
                  </div>
                  <div className="py-2 px-4 space-y-2">
                    {emotionData.emotions.length > 0 && (
                      <div className="flex items-center justify-between rounded-lg  py-2 ">
                        <div className="flex items-center gap-2 flex-wrap">
                          {emotionData.emotions.map((e, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <span className="text-lg">{e?.icon}</span>
                              <span className="text-gray-700 text-sm">{e?.label}</span>
                              {idx < emotionData.emotions.length - 1 && <span className="text-gray-400">,</span>}
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={removeEmotionRow}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Remove emotions"
                        >
                          <CloseIcon />
                        </button>
                      </div>
                    )}
                    {emotionData.emotions.length > 0 && emotionData.context.length > 0 && (
                      <div className="w-full h-[1px] bg-netural-300"></div>
                    )}
                    {emotionData.context.length > 0 && (
                      <div className="flex items-center justify-between rounded-lg  py-2 ">
                        <div className="text-gray-700 text-sm">
                          {emotionData.context.join(", ")}
                        </div>
                        <button
                          onClick={removeContextRow}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Remove context"
                        >
                          <CloseIcon />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 border border-netural-200 rounded-xl px-4 py-3 justify-between cursor-pointer"
                  onClick={() => openModal("", "emotion")}
                >
                  <span className="font-semibold text-main">{t("Conversation Setting")}</span>
                  <SettingsIcon />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  disabled={isTranslating}
                  onClick={() => openModal("from", "language")}
                  className="border border-netural-200 bg-chat-to rounded-xl w-full py-3 px-4 flex justify-between items-center cursor-pointer"
                >
                  <div />
                  <span className="font-semibold text-main text-center">
                    {selectedLanguageFrom.label}
                  </span>
                  <DownIcon />
                </button>
                <button
                  type="button"
                  onClick={swapLanguages}
                  disabled={isTranslating || selectedLanguageFrom.code === null}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTranslating || selectedLanguageFrom.code === null
                    ? <SwapDetectedIcon />
                    : <SwapIcon />}
                </button>

                <button
                  disabled={isTranslating}
                  onClick={() => openModal("to", "language")}
                  className="border border-netural-200 bg-chat-to rounded-xl w-full py-3 px-4 flex justify-between items-center cursor-pointer"
                >
                  <div />
                  <span className="font-semibold text-main text-center">
                    {selectedLanguageTo.label}
                  </span>
                  <DownIcon />
                </button>
              </div>

              <div className="relative mb-4">
                <div className="items-center flex flex-col border border-neutral-200 rounded-2xl ">
                  <IonTextarea
                    autoGrow={true}
                    ref={textareaRef}
                    rows={1}
                    placeholder={t(`Enter text`)}
                    value={inputValueTranslate.input}
                    onIonInput={(e: any) => handleInputTranslate(e)}
                    disabled={isTranslating}
                    className="placeholder:text-gray-500 w-full px-4 pb-2 focus:outline-none resize-none overflow-hidden"
                    style={{
                      border: "none",
                      boxShadow: "none",
                      "--highlight-color-focused": "none",
                      height: "auto",
                      minHeight: "150px",
                    } as React.CSSProperties}
                  />
                </div>
                <div className="absolute right-3 bottom-[-30px]">
                  {
                    inputValueTranslate.input.trim().length > 0 && (
                      <button
                        onClick={() => handleCopyToClipboard(inputValueTranslate.input || "")}
                        className="text-gray-500 hover:text-main transition-colors"
                        disabled={isTranslating}
                      >
                        <IoCopyOutline className="w-5 h-5" />
                      </button>
                    )
                  }
                  {clipboardHasData && (
                    <button
                      onClick={handlePastContent}
                      className="text-gray-500 hover:text-main transition-colors ml-2"
                      disabled={isTranslating}
                    >
                      <GoPaste className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center">
                <button
                  className="bg-main flex justify-center items-center gap-3 rounded-xl text-white px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleTranslateAI()}
                  disabled={isTranslating || !inputValueTranslate.input.trim()}
                >
                  {isTranslating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{t("Translating...")}</span>
                    </>
                  ) : (
                    <>
                      <SparkleIcon />
                      <span>{t("Smart Translate")}</span>
                    </>
                  )}
                </button>
              </div>

              {!!translationResult && (
                <div className="border border-netural-200 bg-chat-to rounded-xl h-full">
                  <div className="space-y-4 p-4">
                    {translationResult.translatedText && (
                      <div className="rounded-2xl">
                        <div className="flex items-center justify-between px-4 py-2">
                          <span className="font-semibold">{t("Translation")}</span>
                          <button
                            onClick={() => handleCopyToClipboard(translationResult.translatedText || "")}
                            className="text-gray-500 hover:text-main transition-colors"
                          >
                            <IoCopyOutline className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-gray-700 whitespace-pre-line break-words">{translationResult.translatedText}</p>
                        </div>
                      </div>
                    )}

                    {/* Reverse Translation - Có thể collapse */}
                    {translationResult.reverseTranslation && (
                      <div className="border-t border-main pt-2 h-full">
                        <div
                          className="flex items-center justify-between px-4 py-2 cursor-pointer  rounded transition-colors"
                          onClick={() => setIsReverseCollapsed(!isReverseCollapsed)}
                        >
                          <span className="font-semibold">{t("Reverse Translation")}</span>
                          <div className="flex items-center gap-2">

                            <button className="text-gray-500 transition-transform duration-200">
                              <DownIcon
                                className={`w-4 h-4 transition-transform duration-200 ${!isReverseCollapsed ? 'rotate-180' : ''}`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Content */}
                        <div
                          className={`h-full transition-all duration-300 ease-in-out ${!isReverseCollapsed ? 'max-h-0 opacity-0' : 'opacity-100'}`}
                        >
                          <div className="px-4 py-3">
                            <p
                              className="text-gray-600 whitespace-pre-line break-words "
                              style={{ wordBreak: "break-word" }}
                            >
                              {translationResult.reverseTranslation}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Review & Insights - Có thể collapse */}
                    {translationResult.aiReviewInsights && (
                      <div className="border-t border-main pt-2">
                        <div
                          className="flex items-center justify-between px-4 py-2 cursor-pointer rounded transition-colors"
                          onClick={() => setIsAiInsightsCollapsed(!isAiInsightsCollapsed)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{t("AI Review & Insights")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyToClipboard(translationResult.aiReviewInsights || "");
                              }}
                              className="text-gray-500 hover:text-main transition-colors"
                            >
                              <IoCopyOutline className="w-4 h-4" />
                            </button> */}
                            <button className="text-gray-500 transition-transform duration-200">
                              <DownIcon
                                className={`w-4 h-4 transition-transform duration-200 ${!isAiInsightsCollapsed ? 'rotate-180' : ''}`}
                              />
                            </button>
                          </div>
                        </div>

                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${!isAiInsightsCollapsed ? 'max-h-0 opacity-0' : ' opacity-100'
                            }`}
                        >
                          <div className="px-4 py-3">
                            <div className="prose prose-sm max-w-none space-y-3">
                              <ReactMarkdown
                                components={{
                                  // Custom styling cho các elements
                                  strong: ({ children }) => (
                                    <strong className="font-bold text-gray-900">{children}</strong>
                                  ),
                                  p: ({ children }) => (
                                    <p className="text-gray-700 mb-1 last:mb-0">{children}</p>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="list-disc list-inside space-y-1 ">{children}</ul>
                                  ),
                                  li: ({ children }) => (
                                    <span className="text-gray-700 block">• {children}</span>
                                  ),
                                  h1: ({ children }) => (
                                    <h1 className="text-lg font-bold text-gray-900 mb-2">{children}</h1>
                                  ),
                                  h2: ({ children }) => (
                                    <h2 className="text-base font-bold text-gray-900 mb-2">{children}</h2>
                                  ),
                                  h3: ({ children }) => (
                                    <h3 className="text-sm font-bold text-gray-900 mb-2">{children}</h3>
                                  ),
                                }}
                              >
                                {translationResult.aiReviewInsights}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
                // : (
                //   <div className="items-center flex flex-col border border-netural-200 bg-chat-to rounded-2xl">
                //     <IonTextarea
                //       autoGrow={true}
                //       ref={textareaRef}
                //       rows={1}
                //       placeholder={t(`Translation`)}
                //       disabled
                //       className="placeholder:text-gray-500 w-full text-ellipsis resize px-4 h-[130px] !max-h-[200px] focus:!outline-0"

                //     />
                //   </div>
                // )
              }
            </div>
          </div>
        </div>
      </MotionBottomSheet >

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
        setEmotionInput={setEmotionInput}
        emotionInput={emotionInput}
        context={context}
        setContext={setContext}
        selected={selected}
        setSelected={setSelected}
        t={t}
      />
    </div>
  );
};

export default TranslateContent;
