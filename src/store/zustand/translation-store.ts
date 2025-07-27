// src/store/zustand/translation-store.ts
import React from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TranslationResult {
  id?: number;
  code?: string;
  originalText: string;
  translatedText: string | null;
  reverseTranslation: string | null;
  aiReviewInsights: string | null;
  fromLanguageId: number | null;
  toLanguageId: number;
  context: string | null;
  emotionType: string | null;
  timestamp: string;
}
export interface EmotionData {
  emotions: { icon: string; label: string }[];
  context: string[];
}
export interface TranslateValue {
  input: string;
  output: string;
}
interface TranslationStore {
  currentResult: TranslationResult | null;
  history: any[];
  isTranslating: boolean;

  // Actions
  setCurrentResult: (result: TranslationResult) => void;
  addToHistory: (newItems: any[]) => void;
  clearCurrentResult: () => void;
  clearHistory: () => void;
  setTranslating: (loading: boolean) => void;

  // Getters
  getResultById: (id: number) => TranslationResult | undefined;
  getRecentTranslations: (limit?: number) => TranslationResult[];
  emotionData: EmotionData | null;
  setEmotionData: React.Dispatch<React.SetStateAction<EmotionData | null>>;
  inputValueTranslate: { input: string; output: string };
  setInputValueTranslate: React.Dispatch<
    React.SetStateAction<{ input: string; output: string }>
  >;
}

export const useTranslationStore = create<TranslationStore>()(
  (set, get) => ({
    currentResult: null,
    history: [],
    isTranslating: false,
    inputValueTranslate: { input: "", output: "" },
    emotionData: null,

    setCurrentResult: (result: TranslationResult) => {
      set({ currentResult: result });

      if (result.translatedText) {
        get().addToHistory([result]);
      }
    },

    addToHistory: (newItems: TranslationResult[]) =>
      set((state) => ({
        history: [
          ...state.history,
          ...newItems.filter(
            item => !state.history.some((i) => i.id === item.id)
          ),
        ],
      })),

    clearCurrentResult: () => set({ currentResult: null }),

    clearHistory: () => set({ history: [] }),

    setTranslating: (loading: boolean) => set({ isTranslating: loading }),

    getResultById: (id: number) => {
      return get().history.find(item => item.id === id);
    },

    getRecentTranslations: (limit = 10) => {
      return get().history.slice(0, limit);
    },

    setEmotionData: (action: React.SetStateAction<EmotionData | null>) => {
      set(state => {
        const newValue =
          typeof action === "function"
            ? (action as (prev: EmotionData | null) => EmotionData | null)(state.emotionData)
            : action;
        return { emotionData: newValue };
      });
    },

    setInputValueTranslate: (action: React.SetStateAction<TranslateValue>) =>
      set(state => {
        const newValue =
          typeof action === "function"
            ? (action as (prev: TranslateValue) => TranslateValue)(state.inputValueTranslate)
            : action;
        return { inputValueTranslate: newValue };
      }),
  }),

);