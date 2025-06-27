import { create } from "zustand";
import { persist } from "zustand/middleware";



export interface HealthInfo {
    diseases: string[];
    otherDisease: string;
    isPregnant: boolean;
    hasSurgery: boolean;
    surgeryDetail: string;
}

export interface AllergyInfo {
    drugAllergies: string[];
    otherDrug: string;
    drugSeverity: string;
    foodAllergies: string[];
    lactoseIntolerance: boolean;
    pollenAllergy: boolean;
}

export interface MedicineInfo {
    medicines: {
        name: string;
        dosage: string;
        frequency: string;
        time: string;
        supplement: string;
    }[];
}



interface OnboardingState {
    health: HealthInfo;
    allergy: AllergyInfo;
    medicine: MedicineInfo;
    setHealth: (data: Partial<HealthInfo>) => void;
    setAllergy: (data: Partial<AllergyInfo>) => void;
    setMedicine: (data: Partial<MedicineInfo>) => void;
    reset: () => void;
}

const defaultState = {
    health: {
        bloodType: "",
        diet: "",
        habits: [],
        diseases: [],
        otherDisease: "",
        isPregnant: false,
        hasSurgery: false,
        surgeryDetail: "",
    },
    allergy: {
        drugAllergies: [],
        otherDrug: "",
        drugSeverity: "",
        foodAllergies: [],
        lactoseIntolerance: false,
        pollenAllergy: false,
    },
    medicine: {
        medicines: [],
    },
};

export const useHeathInformationStore = create<OnboardingState>()(
    persist(
        (set) => ({
            ...defaultState,
            setHealth: (data) => set((state) => ({ health: { ...state.health, ...data } })),
            setAllergy: (data) => set((state) => ({ allergy: { ...state.allergy, ...data } })),
            setMedicine: (data) => set((state) => ({ medicine: { ...state.medicine, ...data } })),
            reset: () => set(defaultState),
        }),
        {
            name: "profile-health-information-storage",
        }
    )
);