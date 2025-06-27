import { User } from "@/types/user";
import { create } from "zustand";



interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    setAuthData: (data: User) => void;
    setProfile: (user: User) => void;
    logout: () => void;
    setUserAfterRegister?: (data: any) => void;
    setAuthenticated: (token: string, refreshToken: string) => void;
    setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: localStorage.getItem("token"),
    refreshToken: localStorage.getItem("refreshToken"),
    isAuthenticated: !!localStorage.getItem("token"),
    setAuthData: (data: User) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);
        set({
            user: data,
            token: data.token,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
        });
    },
    setProfile: (user: User) => set({ user }),

    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("registerEmail");
        localStorage.removeItem("otpLastSent");
        sessionStorage.clear();
        set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
        });
    },
    setUserAfterRegister: (data) => {
        set({
            user: data,
            token: data.token,
            refreshToken: data.refreshToken,
            isAuthenticated: false,
        });
    },

    setAuthenticated: (token, refreshToken) => set({ token, refreshToken, isAuthenticated: false }),

    setUser: (user) => set({ user }),
}));