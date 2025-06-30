import { create } from "zustand";
import { persist } from "zustand/middleware";

interface HealthMasterData {
    bloodTypes: any[];
    groupedHealthConditions: any[];
    groupedAllergies: any[];
    groupedMedications: any[];
    groupedLifestyles: any[];
    severities: any[];
    medicationTimes: any[];
    medicationFrequencies: any[];
}

interface HealthMasterDataState {
    masterData: Partial<HealthMasterData>;
    setMasterData: (data: Partial<HealthMasterData>) => void;
    resetMasterData: () => void;
}

const defaultState: Partial<HealthMasterData> = {
    bloodTypes: [],
    groupedHealthConditions: [],
    groupedAllergies: [],
    groupedMedications: [],
    groupedLifestyles: [],
    severities: [],
    medicationTimes: [],
    medicationFrequencies: [],
};

export const useHealthMasterDataStore = create<HealthMasterDataState>()(
    persist(
        (set) => ({
            masterData: defaultState,
            setMasterData: (data) =>
                set((state) => ({
                    masterData: { ...state.masterData, ...data },
                })),
            resetMasterData: () => set({ masterData: defaultState }),
        }),
        {
            name: "health-master-data-storage",
        }
    )
);