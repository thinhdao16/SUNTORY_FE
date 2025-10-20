import { create } from "zustand";
import { FaRobot, FaBrain, FaCogs, FaFlask } from "react-icons/fa";
import { JSX } from "react";

interface ModelStore {
  selectedModel: string;
  setModel: (model: string) => void;
  getDisplayName: () => string;
  getModelList: () => {
    value: string;
    label: string;
    icon: JSX.Element;
    selected: boolean;
  }[];
  getSelectedModelIcon: () => JSX.Element | null;
}

const loadFromLocalStorage = (key: string, defaultValue: string): string => {
  const storedValue = localStorage.getItem(key);
  return storedValue ? JSON.parse(storedValue) : defaultValue;
};

const modelDisplayNames: Record<string, { label: string; icon: JSX.Element }> =
  {
    "aya:latest": { label: "Aya", icon: <FaRobot /> },
    "gpt:latest": { label: "GPT-4", icon: <FaBrain /> },
    "aya:stable": { label: "Aya Stable", icon: <FaCogs /> },
    "gpt:beta": { label: "GPT Beta", icon: <FaFlask /> },
  };

const useModelStore = create<ModelStore>((set, get) => ({
  selectedModel: loadFromLocalStorage("selectedModel", "aya:latest"),
  setModel: (model: string) => {
    set({ selectedModel: model });
    localStorage.setItem("selectedModel", JSON.stringify(model));
  },
  getDisplayName: () => {
    const selectedModel = get().selectedModel;
    return modelDisplayNames[selectedModel]?.label || "Unknown Model";
  },
  getModelList: () => {
    const selectedModel = get().selectedModel;
    return Object.entries(modelDisplayNames).map(
      ([value, { label, icon }]) => ({
        value,
        label,
        icon,
        selected: value === selectedModel,
      })
    );
  },
  getSelectedModelIcon: () => {
    const selectedModel = get().selectedModel;
    return modelDisplayNames[selectedModel]?.icon || null;
  },
}));

export default useModelStore;
