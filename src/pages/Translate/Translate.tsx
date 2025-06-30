/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

import useLanguageStore from "@/store/zustand/language-store";
import useKeyboardManager from "@/hooks/useKeyboardManager";
import useNetworkStatus from "@/hooks/useNetworkStatus";

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

const Translate: React.FC = () => {
  const { isKeyboardVisible, heightKeyBoard } = useKeyboardManager();
  const { clipboardHasData, clipboardContent } = useClipboardStatus();
  const modelDropdown = useDropdown();

  const isOnline = useNetworkStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [inputValueTranslate, setInputValueTranslate] = useState({
    input: "",
    output: "",
  });
  const [targetModal, setTargetModal] = useState("");
  const [hasFocused, setHasFocused] = useState(false);

  const {
    languages,
    languagesTo,
    selectedLanguageFrom,
    selectedLanguageTo,
    swapLanguages,
    toggleLanguage,
    reloadSwap,
    clipboardContentStatus,
  } = useLanguageStore();
  const { getDisplayName, getModelList, setModel } = useModelStore();
  const modelSelect = getDisplayName();
  const modelList = getModelList();

  const startY = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);
  const screenHeight = useRef(window.innerHeight);
  const textareaRef = useRef<HTMLIonTextareaElement>(null);

  const location = useLocation();


  const velocityThreshold = 0.4;

  const openModal = (e: string) => {
    setIsOpen(true);
    setTranslateY(0);
    setTargetModal(e);
  };

  const closeModal = () => {
    setTranslateY(screenHeight.current);
    setTimeout(() => {
      setIsOpen(false);
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
  };

  const handlePastContent = () => {
    if (clipboardContent) {
      setInputValueTranslate((prev) => ({
        ...prev,
        input: clipboardContent,
      }));
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (inputValueTranslate.input.trim()) {
        axios
          .post(`${(window as any).ENV.API_URL}/translate`, {
            text: inputValueTranslate.input,
            source_lang: "auto",
            target_lang: selectedLanguageTo?.lang,
            model: modelSelect,
          })
          .then((response) => {
            setInputValueTranslate((prev) => ({
              ...prev,
              output: response.data.data.translated_text,
            }));
          })
          .catch((error) => {
            console.error("Axios error:", error);
          });
      } else {
        setInputValueTranslate((prev) => ({
          ...prev,
          output: "",
        }));
      }
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [inputValueTranslate.input, selectedLanguageTo?.lang]);

  useEffect(() => {
    const focusTextarea = async () => {
      if (location.pathname === "/translate" && !hasFocused) {
        setTimeout(async () => {
          const el: any = await textareaRef.current?.getInputElement();
          el.focus();
          el.click();
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
  }, [location, hasFocused]);

  useEffect(() => {
    if (inputValueTranslate.output) {
      setInputValueTranslate((prev) => ({
        ...prev,
        input: inputValueTranslate.output,
      }));
    }
  }, [reloadSwap]);
  return (
    <>
      <MotionStyles
        isOpen={isOpen}
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
            selectedLanguageFrom={selectedLanguageFrom}
            selectedLanguageTo={selectedLanguageTo}
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
          />
        )}
      </MotionStyles>
    </>
  );
};

export default Translate;
