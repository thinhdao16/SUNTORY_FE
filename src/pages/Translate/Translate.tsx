/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import useLanguageStore from "@/store/zustand/language-store";
import { useTranslationStore } from "@/store/zustand/translation-store";
import useKeyboardManager from "@/hooks/useKeyboardManager";
import useNetworkStatus from "@/hooks/useNetworkStatus";
import { useToastStore } from "@/store/zustand/toast-store";

import {
  handleTouchStart as handleTouchStartUtil,
  handleTouchMove as handleTouchMoveUtil,
  handleTouchEnd as handleTouchEndUtil,
} from "@/utils/translate-utils";
import { handleCopyToClipboard } from "@/components/common/HandleCoppy";

import MotionStyles from "@/components/common/bottomSheet/MotionStyles";
import TranslateContent from "./TranslateContent";

import "./Translate.module.css";
import useClipboardStatus from "@/hooks/useClipboardStatus";
import useModelStore from "@/store/zustand/model-store";
import useDropdown from "@/hooks/useDropdown";
import { useTranslationLanguages, useCreateTranslation } from "./hooks/useTranslationLanguages";
import { useTranslation } from "react-i18next";

const Translate: React.FC = () => {
  const { t } = useTranslation();
  const { isKeyboardVisible, heightKeyBoard } = useKeyboardManager();
  const { clipboardHasData, clipboardContent, toggleReloadCopy } = useClipboardStatus();
  const modelDropdown = useDropdown();
  const { showToast } = useToastStore();

  const isOnline = useNetworkStatus();
  const [isOpen, setIsOpen] = useState({ emotion: false, language: false });
  const [translateY, setTranslateY] = useState(0);
  const [inputValue, setInputValue] = useState("");

  const [targetModal, setTargetModal] = useState("");
  const [hasFocused, setHasFocused] = useState(false);


  const [isReverseCollapsed, setIsReverseCollapsed] = useState<boolean>(false);
  const [isAiInsightsCollapsed, setIsAiInsightsCollapsed] = useState<boolean>(false);
  const {
    languages,
    languagesTo,
    selectedLanguageFrom,
    selectedLanguageTo,
    setSelectedLanguageFrom,
    setSelectedLanguageTo,
    swapLanguages,
    toggleLanguage,
    reloadSwap,
    clipboardContentStatus,
    setLanguagesFromAPI,
    setLoading,
  } = useLanguageStore();

  const {
    currentResult,
    setCurrentResult,
    clearCurrentResult,
    isTranslating: storeIsTranslating,
    setTranslating,
    emotionData,
    setEmotionData,
    inputValueTranslate,
    setInputValueTranslate,
  } = useTranslationStore();
  const { getDisplayName, getModelList, setModel } = useModelStore();
  const modelSelect = getDisplayName();
  const modelList = getModelList();

  const { data: translationLanguages, isLoading: isLoadingLanguages } = useTranslationLanguages();
  const createTranslationMutation = useCreateTranslation();

  const startY = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);
  const screenHeight = useRef(window.innerHeight);
  const textareaRef = useRef<HTMLIonTextareaElement>(null);

  const location: any = useLocation();
  const velocityThreshold = 0.4;

  const getLanguageId = (langCode: string | null, langName: string, allowNull = false) => {
    if (!translationLanguages) return allowNull ? null : 0;
    const language = translationLanguages.find(lang =>
      lang.code === langCode ||
      lang.name === langName ||
      lang.nativeName === langName
    );
    if (!language) {
      return allowNull ? null : 0;
    }
    return language.id;
  };
  const formatEmotionType = (emotions: { icon: string; label: string }[]) => {
    return emotions.map(emotion => emotion.label).join(", ");
  };
  const formatContext = (context: string[]) => {
    return context.join(", ");
  };
  const openModal = (e: string, type: string) => {
    setIsOpen((prev) => ({ ...prev, [type]: true }));
    setTranslateY(0);
    setTargetModal(e);
  };
  const closeModal = () => {
    setTranslateY(screenHeight.current);
    setTimeout(() => {
      setIsOpen({ emotion: false, language: false });
      setTranslateY(0);
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleTouchStartUtil(e, startY, startTime);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleTouchMoveUtil(e, startY, screenHeight, setTranslateY);
  };

  const handleTouchEnd = () => {
    handleTouchEndUtil(
      translateY,
      startY,
      startTime,
      screenHeight,
      velocityThreshold,
      closeModal,
      setTranslateY
    );
  };

  const handleInputSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputTranslate = (e: CustomEvent) => {
    const newValue = e.detail.value ?? "";
    setInputValueTranslate((prev: { input: string; output: string }) => ({
      ...prev,
      input: newValue,
    }));
    clearCurrentResult();
  };

  const handlePastContent = async () => {
    if (clipboardContent && textareaRef.current) {
      const textareaEl: any = await textareaRef.current.getInputElement();
      const selectionStart = textareaEl.selectionStart ?? 0;
      const selectionEnd = textareaEl.selectionEnd ?? 0;
      const prevInput = inputValueTranslate.input || "";
      const newInput =
        prevInput.slice(0, selectionStart) +
        clipboardContent +
        prevInput.slice(selectionEnd);

      setInputValueTranslate((prev) => ({
        ...prev,
        input: newInput,
      }));

      clearCurrentResult();
      setTimeout(() => {
        textareaEl.focus();
        const cursorPos = selectionStart + clipboardContent.length;
        textareaEl.setSelectionRange(cursorPos, cursorPos);
      }, 0);
    }
  };
  const handleCopy = (e: string) => {
    handleCopyToClipboard(e);
    toggleReloadCopy();
  }
  const handleTranslateAI = async () => {
    if (!inputValueTranslate.input.trim()) {
      showToast(t("Please enter text to translate"), 3000, "error");
      return;
    }

    setTranslating(true);
    clearCurrentResult();

    try {
      const fromLanguageId = getLanguageId(
        selectedLanguageFrom.code ?? null,
        selectedLanguageFrom.lang,
        true
      );
      const toLanguageId = getLanguageId(
        selectedLanguageTo.code ?? null,
        selectedLanguageTo.lang,
        false
      );

      if (!toLanguageId) {
        showToast(t("Please select a valid target language."), 3000, "error");
        return;
      }

      const payload = {
        fromLanguageId,
        toLanguageId,
        originalText: inputValueTranslate.input.trim(),
        context: emotionData?.context && emotionData.context.length > 0
          ? formatContext(emotionData.context)
          : null,
        emotionType: emotionData?.emotions && emotionData.emotions.length > 0
          ? formatEmotionType(emotionData.emotions)
          : null
      };

      const callTranslation = async () => {
        const result = await createTranslationMutation.mutateAsync(payload);
        return result;
      };
      let result = null;
      let retries = 0;
      const maxRetries = 1;

      do {
        result = await callTranslation();
        const allFieldsEmpty = !result?.data?.translatedText &&
          !result?.data?.reverseTranslation &&
          !result?.data?.aiReviewInsights;

        if (!allFieldsEmpty) break;

        retries++;
        console.warn(`Translation retry attempt #${retries}`);
      } while (retries <= maxRetries);


      if (result.data) {
        const translationResult = {
          originalText: payload.originalText,
          translatedText: result.data.translatedText ?? t("No translation available"),
          reverseTranslation: result.data.reverseTranslation ?? t("No reverse translation available"),
          aiReviewInsights: result.data.aiReviewInsights ?? t("No AI review insights available"),
          fromLanguageId: payload.fromLanguageId ?? 0,
          toLanguageId: payload.toLanguageId ?? 0,
          context: payload.context,
          emotionType: payload.emotionType,
          timestamp: new Date().toISOString(),
        };
        setCurrentResult(translationResult);
        setInputValueTranslate(prev => ({
          ...prev,
          output: result.data.translatedText || ""
        }));
        setIsReverseCollapsed(false);
        setIsAiInsightsCollapsed(false);
        showToast(t("Translation completed successfully!"), 3000, "success");
      }
    } catch (error) {
      console.error("Translation failed:", error);
      showToast(t("Translation failed. Please try again."), 3000, "error");
    } finally {
      setTranslating(false);
    }
  };
  useEffect(() => {
    if (translationLanguages && translationLanguages.length > 0) {
      setLanguagesFromAPI(translationLanguages, t);
      const autoLang = translationLanguages.find(lang => lang.code === "auto" || lang.name.toLowerCase() === "auto");
      const englishLang = translationLanguages.find(lang => lang.code === "en" || lang.name.toLowerCase().includes("english"));

      if (autoLang && englishLang) {
        setSelectedLanguageFrom({ id: autoLang.id, code: autoLang.code, label: autoLang.name, selected: true, lang: autoLang.name });
        setSelectedLanguageTo({ id: englishLang.id, code: englishLang.code, label: englishLang.name, selected: true, lang: englishLang.name });
      }
    }
  }, [translationLanguages, setLanguagesFromAPI]);

  useEffect(() => {
    setLoading(isLoadingLanguages);
  }, [isLoadingLanguages, setLoading]);

  useEffect(() => {
    // const focusTextarea = async () => {
    //   if (location.pathname === "/translate" && !hasFocused) {
    //     setTimeout(async () => {
    //       const el: any = await textareaRef.current?.getInputElement();
    //       el?.focus();
    //       el?.click();
    //       setHasFocused(true);
    //     }, 300);
    //   }
    // };

    if (clipboardContent && clipboardContentStatus) {
      setInputValueTranslate((prev) => ({
        ...prev,
        input: clipboardContent,
      }));
    }
    // focusTextarea();
  }, [location, hasFocused, clipboardContent, clipboardContentStatus]);

  useEffect(() => {
    if (inputValueTranslate.output && reloadSwap) {
      setInputValueTranslate((prev) => ({
        ...prev,
        input: prev.output,
        output: "",
      }));
      clearCurrentResult();
    }
  }, [reloadSwap, clearCurrentResult]);

  useEffect(() => {
    if (location.pathname === "/translate" && !location.state?.history) {
      setEmotionData(null);
      clearCurrentResult();
      setInputValueTranslate({ input: "", output: "" });
    }

  }, [location.pathname, clearCurrentResult,]);

  return (
    <>
      <MotionStyles
        isOpen={isOpen.emotion || isOpen.language}
        translateY={translateY}
        screenHeight={screenHeight.current}
      >
        {({ scale, opacity, borderRadius, backgroundColor }) => (
          <TranslateContent
            isOpen={isOpen}
            scale={scale}
            opacity={opacity}
            borderRadius={borderRadius}
            backgroundColor={backgroundColor}
            isKeyboardVisible={isKeyboardVisible}
            heightKeyBoard={heightKeyBoard}
            inputValueTranslate={inputValueTranslate}
            setInputValueTranslate={setInputValueTranslate}
            handleInputTranslate={handleInputTranslate}
            handleCopyToClipboard={handleCopy}
            openModal={openModal}
            closeModal={closeModal}
            swapLanguages={swapLanguages}
            selectedLanguageFrom={{
              ...selectedLanguageFrom,
              code:
                selectedLanguageFrom.code === undefined || selectedLanguageFrom.code === null
                  ? null
                  : typeof selectedLanguageFrom.code === "string"
                    ? Number(selectedLanguageFrom.code)
                    : selectedLanguageFrom.code
            }}
            selectedLanguageTo={{
              ...selectedLanguageTo,
              code:
                selectedLanguageTo.code === undefined || selectedLanguageTo.code === null
                  ? 0
                  : typeof selectedLanguageTo.code === "string"
                    ? Number(selectedLanguageTo.code)
                    : selectedLanguageTo.code
            }}
            languages={languages}
            languagesTo={languagesTo}
            targetModal={targetModal}
            inputValue={inputValue}
            handleInputSearch={handleInputSearch}
            setInputValue={setInputValue}
            handleTouchStart={handleTouchStart}
            handleTouchMove={handleTouchMove}
            handleTouchEnd={handleTouchEnd}
            textareaRef={textareaRef}
            toggleLanguage={toggleLanguage}
            isOnline={isOnline}
            translateY={translateY}
            clipboardHasData={clipboardHasData}
            clipboardContent={clipboardContent}
            t={t}
            handlePastContent={handlePastContent}
            modelList={modelList}
            setModel={setModel}
            modelDropdown={modelDropdown}
            modelSelect={modelSelect}
            setEmotionData={setEmotionData}
            emotionData={emotionData}
            handleTranslateAI={handleTranslateAI}
            isTranslating={storeIsTranslating || createTranslationMutation.isLoading}
            translationResult={currentResult}
            isReverseCollapsed={isReverseCollapsed}
            isAiInsightsCollapsed={isAiInsightsCollapsed}
            setIsReverseCollapsed={setIsReverseCollapsed}
            setIsAiInsightsCollapsed={setIsAiInsightsCollapsed}
          />
        )}
      </MotionStyles>
    </>
  );
};

export default Translate;
