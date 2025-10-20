import { create } from "zustand";

interface ThemeState {
  colorMain: string;
  setColorMain: (color: string) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  colorMain: "#AD1F23",
  setColorMain: (color) => {
    set({ colorMain: color });
    document.documentElement.style.setProperty("--color-main", color);
  },
}));
