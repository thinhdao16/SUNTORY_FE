import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface MasterDataState {
    bloodTypes: any[];
    healthConditions: any[];
    allergies: any[];
    lifestyles: any[];
    severities: any[];
    medicationTimes: any[];
    medicationFrequencies: any[];
    setMasterData: (data: Partial<Omit<MasterDataState, "setMasterData">>) => void;
    reset: () => void;
}

const defaultState = {
    bloodTypes: [],
    healthConditions: [],
    allergies: [],
    lifestyles: [],
    severities: [],
    medicationTimes: [],
    medicationFrequencies: [],
};

export const useHealthMasterDataStore = create<MasterDataState>()(
    persist(
        (set) => ({
            ...defaultState,
            setMasterData: (data) => set((state) => ({ ...state, ...data })),
            reset: () => set(defaultState),
        }),
        { name: "health-master-data" }
    )
);