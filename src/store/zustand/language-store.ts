/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { TranslationLanguage } from "@/services/translation/translation-service";
import { useToastStore } from "@/store/zustand/toast-store";
import { useTranslation } from "react-i18next";

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
  languagesSocialChat: Language[];
  selectedLanguageFrom: Language;
  selectedLanguageTo: Language;
  selectedLanguageSocialChat: Language;
  setSelectedLanguageFrom: (item: Language) => void;
  setSelectedLanguageTo: (item: Language) => void;
  setSelectedLanguageSocialChat: (item: Language) => void;
  reloadSwap: number;
  isLoading: boolean;
  setLanguagesFromAPI: (apiLanguages: TranslationLanguage[], t: (key: string) => string) => void;
  setLanguagesSocialChatFromAPI: (apiLanguages: TranslationLanguage[], t: (key: string) => string) => void;
  setLanguages: (languages: Language[]) => void;
  setLanguagesTo: (languagesTo: Language[]) => void;
  setLanguagesSocialChat: (languagesSocialChat: Language[]) => void;
  toggleLanguage: (type: "from" | "to", lang: string) => void;
  swapLanguages: () => void;
  clipboardContentStatus: boolean;
  setClipboardContentStatus: (content: boolean) => void;
  setLoading: (loading: boolean) => void;
  getAvailableLanguagesFrom: () => Language[];
  getAvailableLanguagesTo: () => Language[];
  shouldAutoTranslate: boolean;
  setShouldAutoTranslate: (value: boolean) => void;
  onSelectSocialChat: (lang: string) => void;

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
const transformAPILanguages = (
  apiLanguages: TranslationLanguage[],
  t: (key: string) => string
): Language[] => {
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
const transformAPILanguagesSocialChat = (
  apiLanguages: TranslationLanguage[],
  t: (key: string) => string
): Language[] => {


  const transformedLanguages = apiLanguages
    .sort((a, b) => a.orderView - b.orderView)
    .map((lang) => ({
      label: lang.nativeName,
      selected: false,
      lang: lang.name,
      code: lang.code,
      id: lang.id,
    }));

  return [ ...transformedLanguages];
};

const useLanguageStore = create<LanguageStore>((set, get) => ({
  languages: [
    { label: "Detect language", selected: true, lang: "Detect", code: null, id: -1 },
    { label: "Tiếng Việt", selected: false, lang: "Vietnamese", code: "vi" },
    { label: "English", selected: false, lang: "English", code: "en" },
  ],
  languagesTo: [
    { label: "Tiếng Việt", selected: false, lang: "Vietnamese", code: "vi" },
    { label: "English", selected: true, lang: "English", code: "en" },
  ],
  languagesSocialChat: [
    // { label: "Detect language", selected: true, lang: "Detect", code: null, id: -1 },
    { label: "Tiếng Việt", selected: false, lang: "Vietnamese", code: "vi" },
    { label: "English", selected: false, lang: "English", code: "en" },
  ],
  selectedLanguageFrom: loadFromLocalStorage("selectedLanguageFrom", {
    label: "Detect language",
    lang: "Detect",
    code: "auto",
    id: -1,
  }),
  selectedLanguageTo: loadFromLocalStorage("selectedLanguageTo", {
    label: "English",
    lang: "English",
    code: "en",
  }),
  selectedLanguageSocialChat: loadFromLocalStorage("selectedLanguageSocialChat", {
    label: "English",
    lang: "English",
    code: "en",
    id: 2,
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
  setSelectedLanguageSocialChat: (item) => {
    set({ selectedLanguageSocialChat: item });
    localStorage.setItem("selectedLanguageSocialChat", JSON.stringify(item));
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
  setLanguagesFromAPI: (apiLanguages: TranslationLanguage[], t: (key: string) => string) => {
    const transformedLanguages = transformAPILanguages(apiLanguages, t);
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
  setLanguagesSocialChatFromAPI: (apiLanguages: TranslationLanguage[], t: (key: string) => string) => {
    const transformedLanguages = transformAPILanguagesSocialChat(apiLanguages, t);
    const languagesSocialChat = transformedLanguages.map((lang) => ({
      ...lang,
      // selected: lang.lang === "Detect" && lang.code === null,
    }));
    const currentFrom = get().selectedLanguageSocialChat;
    const finalLanguagesFrom = languagesSocialChat.map((lang) => ({
      ...lang,
      selected:
        (lang.lang === currentFrom.lang && lang.code === currentFrom.code)
        //  ||
        // (currentFrom.lang === "Detect" && lang.lang === "Detect" && lang.code === null),
    }));

    set({
      languagesSocialChat: finalLanguagesFrom,
    });
    localStorage.setItem("languagesSocialChat", JSON.stringify(finalLanguagesFrom));
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
  setLanguagesSocialChat: (languagesSocialChat) => {
    set({ languagesSocialChat });
    localStorage.setItem("languagesSocialChat", JSON.stringify(languagesSocialChat));
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
  onSelectSocialChat: (lang) => {
    const currentList = get().languagesSocialChat;

    const updatedLanguages = currentList.map((item) => ({
      ...item,
      selected: item.lang === lang,
    }));

    const selected = updatedLanguages.find((item) => item.lang === lang) ?? currentList[0];

    set({
      languagesSocialChat: updatedLanguages,
      selectedLanguageSocialChat: selected,
    });

    localStorage.setItem("languagesSocialChat", JSON.stringify(updatedLanguages));
    localStorage.setItem("selectedLanguageSocialChat", JSON.stringify(selected));
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
