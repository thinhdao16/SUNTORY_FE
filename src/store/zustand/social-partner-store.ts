import { create } from "zustand";

interface SocialPartnerState {
    createdPartnerId: string | null;
    setCreatedPartnerId: (id: string) => void;
    clearCreatedPartnerId: () => void;
}

export const useSocialPartnerStore = create<SocialPartnerState>((set) => ({
    createdPartnerId: null,
    setCreatedPartnerId: (id) => set({ createdPartnerId: id }),
    clearCreatedPartnerId: () => set({ createdPartnerId: null }),
}));
