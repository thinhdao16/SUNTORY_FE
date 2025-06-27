import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BasicInfo {
    fullName: string;
    birthday: string;
    gender: string;
    height: string;
    weight: string;
    bloodType: string;
    diet: string;
    habits: string[];
}

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

// Thêm interface cho step
export interface StepState {
    currentStep: number;
    visitedSteps: boolean[];
    setCurrentStep: (step: number) => void;
    markStepVisited: (step: number) => void;
    resetSteps: () => void;
}

interface OnboardingState extends StepState {
    basic: BasicInfo;
    health: HealthInfo;
    allergy: AllergyInfo;
    medicine: MedicineInfo;
    setBasic: (data: Partial<BasicInfo>) => void;
    setHealth: (data: Partial<HealthInfo>) => void;
    setAllergy: (data: Partial<AllergyInfo>) => void;
    setMedicine: (data: Partial<MedicineInfo>) => void;
    reset: () => void;
}

const TOTAL_STEPS = 5;

const defaultState = {
    currentStep: 0,
    visitedSteps: Array(TOTAL_STEPS).fill(false),
    basic: {
        fullName: "",
        birthday: "",
        gender: "",
        height: "",
        weight: "",
        bloodType: "",
        diet: "",
        habits: [],
    },
    health: {
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
            currentStep: 0,
            visitedSteps: Array(TOTAL_STEPS).fill(false),
            setCurrentStep: (step) => set({ currentStep: step }),
            markStepVisited: (step) =>
                set((state) => {
                    const updated = [...state.visitedSteps];
                    updated[step] = true;
                    return { visitedSteps: updated };
                }),
            resetSteps: () =>
                set({
                    currentStep: 0,
                    visitedSteps: Array(TOTAL_STEPS).fill(false),
                }),
            setBasic: (data) => set((state) => ({ basic: { ...state.basic, ...data } })),
            setHealth: (data) => set((state) => ({ health: { ...state.health, ...data } })),
            setAllergy: (data) => set((state) => ({ allergy: { ...state.allergy, ...data } })),
            setMedicine: (data) => set((state) => ({ medicine: { ...state.medicine, ...data } })),
            reset: () => set(defaultState),
        }),
        {
            name: "health-information-storage",
        }
    )
);