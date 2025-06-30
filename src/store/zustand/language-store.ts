/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";

interface Language {
  label: string;
  selected: boolean;
  lang: string;
}

interface LanguageStore {
  languages: Language[];
  languagesTo: Language[];
  selectedLanguageFrom: { label: string; lang: string };
  selectedLanguageTo: { label: string; lang: string };
  reloadSwap: number;
  setLanguages: (languages: Language[]) => void;
  setLanguagesTo: (languagesTo: Language[]) => void;
  toggleLanguage: (type: "from" | "to", lang: string) => void;
  swapLanguages: () => void;
  clipboardContentStatus: boolean;
  setClipboardContentStatus: (content: boolean) => void;
}

const loadFromLocalStorage = (key: string, defaultValue: any) => {
  const storedValue = localStorage.getItem(key);
  try {
    return storedValue
      ? JSON.parse(decodeURIComponent(storedValue))
      : defaultValue;
  } catch (error) {
    console.error(`Error parsing localStorage key "${key}":`, error);
    return storedValue;
  }
};

const useLanguageStore = create<LanguageStore>((set) => ({
  languages: [
    { label: "Tiếng Việt", selected: true, lang: "Vietnamese" },
    { label: "Tiếng Anh", selected: false, lang: "English" },
    { label: "中文", selected: false, lang: "Chinese" },
    { label: "Tiếng Đức", selected: false, lang: "German" },
    { label: "Tiếng Pháp", selected: false, lang: "French" },
    { label: "日本語", selected: false, lang: "Japanese" },
    { label: "한국어", selected: false, lang: "Korean" },
  ],
  languagesTo: [
    { label: "Tiếng Việt", selected: false, lang: "Vietnamese" },
    { label: "Tiếng Anh", selected: true, lang: "English" },
    { label: "中文", selected: false, lang: "Chinese" },
    { label: "Tiếng Đức", selected: false, lang: "German" },
    { label: "Tiếng Pháp", selected: false, lang: "French" },
    { label: "日本語", selected: false, lang: "Japanese" },
    { label: "한국어", selected: false, lang: "Korean" },
  ],
  selectedLanguageFrom: loadFromLocalStorage("selectedLanguageFrom", {
    label: "Tiếng Việt",
    lang: "Vietnamese",
  }),
  selectedLanguageTo: loadFromLocalStorage("selectedLanguageTo", {
    label: "English",
    lang: "English",
  }),
  reloadSwap: 0,
  setLanguages: (languages) => {
    set({ languages });
    localStorage.setItem("languages", JSON.stringify(languages));
  },
  setLanguagesTo: (languagesTo) => {
    set({ languagesTo });
    localStorage.setItem("languagesTo", JSON.stringify(languagesTo));
  },
  toggleLanguage: (type, lang) =>
    set((state: any) => {
      const key = type === "from" ? "languages" : "languagesTo";
      const updated = state[key].map((item: { lang: string }) =>
        item.lang === lang
          ? { ...item, selected: true }
          : { ...item, selected: false }
      );
      const selectedItem = updated.find(
        (item: { selected: boolean }) => item.selected
      ) || {
        label: "Chọn ngôn ngữ",
        lang: "",
      };
      const newState = {
        [key]: updated,
        selectedLanguageFrom:
          type === "from" ? selectedItem : state.selectedLanguageFrom,
        selectedLanguageTo:
          type === "to" ? selectedItem : state.selectedLanguageTo,
      };
      localStorage.setItem(key, JSON.stringify(updated));
      localStorage.setItem(
        type === "from" ? "selectedLanguageFrom" : "selectedLanguageTo",
        JSON.stringify(selectedItem)
      );
      return newState;
    }),

  swapLanguages: () =>
    set((state) => {
      const newLanguages = state.languages.map((item) => ({
        ...item,
        selected: item.lang === state.selectedLanguageTo.lang,
      }));
      const newLanguagesTo = state.languagesTo.map((item) => ({
        ...item,
        selected: item.lang === state.selectedLanguageFrom.lang,
      }));
      const newState = {
        languages: newLanguages,
        languagesTo: newLanguagesTo,
        selectedLanguageFrom: state.selectedLanguageTo,
        selectedLanguageTo: state.selectedLanguageFrom,
        reloadSwap: state.reloadSwap + 1,
      };
      localStorage.setItem("languages", JSON.stringify(newLanguages));
      localStorage.setItem("languagesTo", JSON.stringify(newLanguagesTo));
      localStorage.setItem(
        "selectedLanguageFrom",
        JSON.stringify(state.selectedLanguageTo)
      );
      localStorage.setItem(
        "selectedLanguageTo",
        JSON.stringify(state.selectedLanguageFrom)
      );
      return newState;
    }),
  clipboardContentStatus: false,
  setClipboardContentStatus: (content) => {
    set({ clipboardContentStatus: content });
  },
}));

export default useLanguageStore;
