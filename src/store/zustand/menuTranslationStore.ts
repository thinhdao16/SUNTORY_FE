import { create } from "zustand";

interface AllergyItem {
    allergyId: number;
    name: string;
}

interface MenuTranslationStoreState {
    isConnected: boolean;
    setIsConnected: (val: boolean) => void;
    isSending: boolean;
    setIsSending: (val: boolean) => void;
    foodSuccess: number;
    setFoodSuccess: (val: number) => void;
    foodFailed: number;
    setFoodFailed: (val: number) => void;
    savedAllergiesStore: AllergyItem[];
    setSavedAllergiesStore: (val: AllergyItem[]) => void;
    selectedAllergiesStore: AllergyItem[];
    setSelectedAllergiesStore: (val: AllergyItem[]) => void;
    diet: string;
    setDiet: (val: string) => void;
    isUseCamera: boolean;
    setIsUseCamera: (val: boolean) => void;
}

export const useMenuTranslationStore = create<MenuTranslationStoreState>()(
    (set) => ({
        isConnected: false, 
        setIsConnected: (val) => set({ isConnected: val }),
        isSending: false,
        setIsSending: (val) => set({ isSending: val }),
        foodSuccess: 0,
        setFoodSuccess: (val) => set({ foodSuccess: val }),
        foodFailed: 0,
        setFoodFailed: (val) => set({ foodFailed: val }),
        savedAllergiesStore: [],
        setSavedAllergiesStore: (val) => set({ savedAllergiesStore: val }),
        selectedAllergiesStore: [],
        setSelectedAllergiesStore: (val) => set({ selectedAllergiesStore: val }),
        diet: '',
        setDiet: (val: string) => set({ diet: val }),
        isUseCamera: false,
        setIsUseCamera: (val) => set({ isUseCamera: val }),
    })
);