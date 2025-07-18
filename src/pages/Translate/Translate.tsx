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
import { t } from "@/lib/globalT";

const Translate: React.FC = () => {
  const { isKeyboardVisible, heightKeyBoard } = useKeyboardManager();
  const { clipboardHasData, clipboardContent } = useClipboardStatus();
  const modelDropdown = useDropdown();
  const { showToast } = useToastStore();

  const isOnline = useNetworkStatus();
  const [isOpen, setIsOpen] = useState({ emotion: false, language: false });
  const [translateY, setTranslateY] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [inputValueTranslate, setInputValueTranslate] = useState({
    input: "",
    output: "",
  });
  const [targetModal, setTargetModal] = useState("");
  const [hasFocused, setHasFocused] = useState(false);

  const [emotionData, setEmotionData] = useState<{
    emotions: { icon: string; label: string }[];
    context: string[];
  } | null>(null);

  const {
    languages,
    languagesTo,
    selectedLanguageFrom,
    selectedLanguageTo,
    swapLanguages,
    toggleLanguage,
    reloadSwap,
    clipboardContentStatus,
    setLanguagesFromAPI,
    setLoading,
    shouldAutoTranslate,
    setShouldAutoTranslate,
  } = useLanguageStore();

  // Translation Store
  const {
    currentResult,
    setCurrentResult,
    clearCurrentResult,
    isTranslating: storeIsTranslating,
    setTranslating,
  } = useTranslationStore();

  const { getDisplayName, getModelList, setModel } = useModelStore();
  const modelSelect = getDisplayName();
  const modelList = getModelList();

  // React Query hooks
  const { data: translationLanguages, isLoading: isLoadingLanguages } = useTranslationLanguages();
  const createTranslationMutation = useCreateTranslation();

  const startY = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);
  const screenHeight = useRef(window.innerHeight);
  const textareaRef = useRef<HTMLIonTextareaElement>(null);

  const location = useLocation();
  const velocityThreshold = 0.4;

  // Helper function to get language ID by code/lang
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

  // Helper function to format emotion data
  const formatEmotionType = (emotions: { icon: string; label: string }[]) => {
    return emotions.map(emotion => emotion.label).join(", ");
  };

  // Helper function to format context
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
    setInputValueTranslate((prev) => ({
      ...prev,
      input: newValue,
    }));

    // Clear current result when input changes
    if (newValue !== currentResult?.originalText) {
      clearCurrentResult();
    }
  };

  const handlePastContent = () => {
    if (clipboardContent) {
      setInputValueTranslate((prev) => ({
        ...prev,
        input: clipboardContent,
      }));
      clearCurrentResult(); 
    }
  };

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

      if (toLanguageId) {
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

      const result = await createTranslationMutation.mutateAsync(payload);

      if (result.data) {
        const translationResult = {
          // id: result.data.id,
          // code: result.data.code,
          originalText: payload.originalText,
          translatedText: result.data.translatedText,
          reverseTranslation: result.data.reverseTranslation ?? "",
          aiReviewInsights: result.data.aiReviewInsights ?? "",
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

        showToast(t("Translation completed successfully!"), 3000, "success");
      }
    } catch (error) {
      console.error("Translation failed:", error);
      showToast(t("Translation failed. Please try again."), 3000, "error");
    } finally {
      setTranslating(false);
    }
  };

  // Load translation languages on mount
  useEffect(() => {
    if (translationLanguages && translationLanguages.length > 0) {
      setLanguagesFromAPI(translationLanguages);
    }
  }, [translationLanguages, setLanguagesFromAPI]);

  useEffect(() => {
    setLoading(isLoadingLanguages);
  }, [isLoadingLanguages, setLoading]);

  useEffect(() => {
    const focusTextarea = async () => {
      if (location.pathname === "/translate" && !hasFocused) {
        setTimeout(async () => {
          const el: any = await textareaRef.current?.getInputElement();
          el?.focus();
          el?.click();
          setHasFocused(true);
        }, 300);
      }
    };

    if (clipboardContent && clipboardContentStatus) {
      setInputValueTranslate((prev) => ({
        ...prev,
        input: clipboardContent,
      }));
    }
    focusTextarea();
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
    if (shouldAutoTranslate && inputValueTranslate.input.trim() && !storeIsTranslating) {
      setShouldAutoTranslate(false);
      setTimeout(() => {
        handleTranslateAI();
      }, 500);
    }
  }, [shouldAutoTranslate, inputValueTranslate.input, storeIsTranslating, handleTranslateAI, setShouldAutoTranslate]);

  useEffect(() => {
    if (location.pathname === "/translate") {
      clearCurrentResult();
    }
  }, [location.pathname, clearCurrentResult]);
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
            handleCopyToClipboard={handleCopyToClipboard}
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
          />
        )}
      </MotionStyles>
    </>
  );
};

export default Translate;
