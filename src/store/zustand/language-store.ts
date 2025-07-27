/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { TranslationLanguage } from "@/services/translation/translation-service";
import { useToastStore } from "@/store/zustand/toast-store";

export interface Language {
  label: string;
  selected: boolean;
  lang: string;
  code?: string | null;
  id?: number;
}

interface LanguageStore {
  languages: Language[];
  languagesTo: Language[];
  selectedLanguageFrom: Language;
  selectedLanguageTo: Language;
  setSelectedLanguageFrom: (item: Language) => void;
  setSelectedLanguageTo: (item: Language) => void;
  reloadSwap: number;
  isLoading: boolean;
  setLanguagesFromAPI: (apiLanguages: TranslationLanguage[]) => void;
  setLanguages: (languages: Language[]) => void;
  setLanguagesTo: (languagesTo: Language[]) => void;
  toggleLanguage: (type: "from" | "to", lang: string) => void;
  swapLanguages: () => void;
  clipboardContentStatus: boolean;
  setClipboardContentStatus: (content: boolean) => void;
  setLoading: (loading: boolean) => void;
  getAvailableLanguagesFrom: () => Language[];
  getAvailableLanguagesTo: () => Language[];
  shouldAutoTranslate: boolean;
  setShouldAutoTranslate: (value: boolean) => void;
}
const loadFromLocalStorage = (key: string, defaultValue: any) => {
  const storedValue = localStorage.getItem(key);
  try {
    return storedValue
      ? JSON.parse(decodeURIComponent(storedValue))
      : defaultValue;
  } catch (error) {
    console.error(`Error parsing localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const transformAPILanguages = (apiLanguages: TranslationLanguage[]): Language[] => {
  const detectLanguage: Language = {
    label: t("Detect language"),
    selected: false,
    lang: "Detect",
    code: null,
    id: -1,
  };

  const transformedLanguages = apiLanguages
    .sort((a, b) => a.orderView - b.orderView)
    .map((lang) => ({
      label: lang.nativeName,
      selected: false,
      lang: lang.name,
      code: lang.code,
      id: lang.id,
    }));

  return [detectLanguage, ...transformedLanguages];
};
const useLanguageStore = create<LanguageStore>((set, get) => ({
  languages: [
    { label: t("Detect language"), selected: true, lang: "Detect", code: null, id: -1 },
    { label: "Tiếng Việt", selected: false, lang: "Vietnamese", code: "vi" },
    { label: "English", selected: false, lang: "English", code: "en" },
  ],
  languagesTo: [
    { label: "Tiếng Việt", selected: false, lang: "Vietnamese", code: "vi" },
    { label: "English", selected: true, lang: "English", code: "en" },
  ],
  selectedLanguageFrom: loadFromLocalStorage("selectedLanguageFrom", {
    label: t("Detect language"),
    lang: "Detect",
    code: "auto",
    id: -1,
  }),
  selectedLanguageTo: loadFromLocalStorage("selectedLanguageTo", {
    label: "English",
    lang: "English",
    code: "en",
  }),
  reloadSwap: 0,
  isLoading: false,
  setSelectedLanguageFrom: (item) => {
    set({ selectedLanguageFrom: item });
    localStorage.setItem("selectedLanguageFrom", JSON.stringify(item));
  },
  setSelectedLanguageTo: (item) => {
    set({ selectedLanguageTo: item });
    localStorage.setItem("selectedLanguageTo", JSON.stringify(item));
  },
  getAvailableLanguagesFrom: () => {
    const state = get();
    const selectedTo = state.selectedLanguageTo;
    return state.languages.filter(lang => {
      if (lang.code === null && lang.lang === "Detect") {
        return true;
      }
      const isSelectedInTo = selectedTo && (
        (lang.id && selectedTo.id && lang.id === selectedTo.id) ||
        (lang.lang === selectedTo.lang && lang.code === selectedTo.code)
      );
      return !isSelectedInTo;
    });
  },
  getAvailableLanguagesTo: () => {
    const state = get();
    const selectedFrom = state.selectedLanguageFrom;
    return state.languagesTo.filter(lang => {
      if (lang.code === null && lang.lang === "Detect") {
        return false;
      }
      const isSelectedInFrom = selectedFrom && selectedFrom.code !== null && (
        (lang.id && selectedFrom.id && lang.id === selectedFrom.id) ||
        (lang.lang === selectedFrom.lang && lang.code === selectedFrom.code)
      );
      return !isSelectedInFrom;
    });
  },
  setLanguagesFromAPI: (apiLanguages: TranslationLanguage[]) => {
    const transformedLanguages = transformAPILanguages(apiLanguages);
    const languagesFrom = transformedLanguages.map((lang) => ({
      ...lang,
      selected: lang.lang === "Detect" && lang.code === null,
    }));
    const languagesTo = transformedLanguages
      .filter(lang => lang.code !== null)
      .map((lang) => ({
        ...lang,
        selected: lang.lang === "English" || lang.code === "en",
      }));
    const currentFrom = get().selectedLanguageFrom;
    const currentTo = get().selectedLanguageTo;
    const finalLanguagesFrom = languagesFrom.map((lang) => ({
      ...lang,
      selected:
        (lang.lang === currentFrom.lang && lang.code === currentFrom.code) ||
        (currentFrom.lang === "Detect" && lang.lang === "Detect" && lang.code === null),
    }));
    const finalLanguagesTo = languagesTo.map((lang) => ({
      ...lang,
      selected: lang.lang === currentTo.lang || lang.code === currentTo.code,
    }));
    set({
      languages: finalLanguagesFrom,
      languagesTo: finalLanguagesTo,
    });
    localStorage.setItem("languages", JSON.stringify(finalLanguagesFrom));
    localStorage.setItem("languagesTo", JSON.stringify(finalLanguagesTo));
  },
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setLanguages: (languages) => {
    set({ languages });
    localStorage.setItem("languages", JSON.stringify(languages));
  },
  setLanguagesTo: (languagesTo) => {
    set({ languagesTo });
    localStorage.setItem("languagesTo", JSON.stringify(languagesTo));
  },
  toggleLanguage: (type, lang) => {
    const { showToast } = useToastStore.getState();
    return set((state: any) => {
      const key = type === "from" ? "languages" : "languagesTo";
      const oppositeSelectedKey = type === "from" ? "selectedLanguageTo" : "selectedLanguageFrom";
      const selectedLang = state[key].find((item: any) => item.lang === lang);
      const oppositeSelected = state[oppositeSelectedKey];
      const isConflict = selectedLang && oppositeSelected && selectedLang.code !== null && (
        (selectedLang.id && oppositeSelected.id && selectedLang.id === oppositeSelected.id) ||
        (selectedLang.lang === oppositeSelected.lang && selectedLang.code === oppositeSelected.code)
      );
      if (isConflict) {
        const oppositeSideKey = type === "from" ? "target language" : "source language"
        const sideLabel = t(oppositeSideKey)
        const message = t("language_already_selected_message", { side: sideLabel })
        showToast(message, 3000, "warning")
        console.warn(message)
        return state
      }
      const updated = state[key].map((item: any) =>
        item.lang === lang ? { ...item, selected: true } : { ...item, selected: false }
      );
      const selectedItem = updated.find((item: any) => item.selected) || {
        label: "Chọn ngôn ngữ",
        lang: "",
        code: "",
      };
      const newState = {
        ...state,
        [key]: updated,
        selectedLanguageFrom: type === "from" ? selectedItem : state.selectedLanguageFrom,
        selectedLanguageTo: type === "to" ? selectedItem : state.selectedLanguageTo,
      };
      localStorage.setItem(key, JSON.stringify(updated));
      localStorage.setItem(
        type === "from" ? "selectedLanguageFrom" : "selectedLanguageTo",
        JSON.stringify(selectedItem)
      );
      return newState;
    });
  },
  swapLanguages: () => {
    const { showToast } = useToastStore.getState();

    return set((state) => {
      if (state.selectedLanguageFrom.code === null) {
        showToast(t("Cannot swap when 'Detect language' is selected"), 3000, "warning");
        console.warn("Cannot swap when 'Detect language' is selected");
        return state;
      }

      const newLanguages = state.languages.map((item) => ({
        ...item,
        selected: item.lang === state.selectedLanguageTo.lang && item.code === state.selectedLanguageTo.code,
      }));

      const newLanguagesTo = state.languagesTo.map((item) => ({
        ...item,
        selected: item.lang === state.selectedLanguageFrom.lang && item.code === state.selectedLanguageFrom.code,
      }));

      const newState = {
        ...state,
        languages: newLanguages,
        languagesTo: newLanguagesTo,
        selectedLanguageFrom: state.selectedLanguageTo,
        selectedLanguageTo: state.selectedLanguageFrom,
        reloadSwap: state.reloadSwap + 1,
        shouldAutoTranslate: true,
      };

      localStorage.setItem("languages", JSON.stringify(newLanguages));
      localStorage.setItem("languagesTo", JSON.stringify(newLanguagesTo));
      localStorage.setItem("selectedLanguageFrom", JSON.stringify(state.selectedLanguageTo));
      localStorage.setItem("selectedLanguageTo", JSON.stringify(state.selectedLanguageFrom));
      showToast(t("Languages swapped successfully"), 2000, "success");

      return newState;
    });
  },
  shouldAutoTranslate: false,
  setShouldAutoTranslate: (value: boolean) => set({ shouldAutoTranslate: value }),

  clipboardContentStatus: false,
  setClipboardContentStatus: (content) => {
    set({ clipboardContentStatus: content });
  },
}));

export default useLanguageStore;
