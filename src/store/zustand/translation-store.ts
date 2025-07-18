// src/store/zustand/translation-store.ts
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

interface TranslationStore {
  currentResult: TranslationResult | null;
  history: TranslationResult[];
  isTranslating: boolean;

  // Actions
  setCurrentResult: (result: TranslationResult) => void;
  addToHistory: (result: TranslationResult) => void;
  clearCurrentResult: () => void;
  clearHistory: () => void;
  setTranslating: (loading: boolean) => void;

  // Getters
  getResultById: (id: number) => TranslationResult | undefined;
  getRecentTranslations: (limit?: number) => TranslationResult[];
}

export const useTranslationStore = create<TranslationStore>()(
  persist(
    (set, get) => ({
      currentResult: null,
      history: [],
      isTranslating: false,

      setCurrentResult: (result: TranslationResult) => {
        set({ currentResult: result });

        if (result.translatedText) {
          get().addToHistory(result);
        }
      },

      addToHistory: (result: TranslationResult) => {
        set((state) => {
          const exists = state.history.some(item =>
            item.originalText === result.originalText &&
            item.fromLanguageId === result.fromLanguageId &&
            item.toLanguageId === result.toLanguageId
          );

          if (!exists) {
            return {
              history: [result, ...state.history].slice(0, 50)
            };
          }
          return state;
        });
      },

      clearCurrentResult: () => set({ currentResult: null }),

      clearHistory: () => set({ history: [] }),

      setTranslating: (loading: boolean) => set({ isTranslating: loading }),

      getResultById: (id: number) => {
        return get().history.find(item => item.id === id);
      },

      getRecentTranslations: (limit = 10) => {
        return get().history.slice(0, limit);
      },
    }),
    {
      name: "translation-store",
      partialize: (state) => ({
        // currentResult: state.currentResult,
        history: state.history,
      }),
    }
  )
);