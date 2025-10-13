import { User } from "@/types/user";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { googleLogout } from '@react-oauth/google';
import { logoutApi } from "@/services/auth/auth-service";

interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    setAuthData: (data: User) => void;
    setProfile: (user: User) => void;
    logout: (deviceId?: string) => Promise<void>;
    setUserAfterRegister?: (data: any) => void;
    setAuthenticated: (token: string, refreshToken: string) => void;
    setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: localStorage.getItem("token"),
            refreshToken: localStorage.getItem("refreshToken"),
            isAuthenticated: !!localStorage.getItem("token"),

            setAuthData: (data: User) => {
                // Lưu token và refreshToken vào localStorage riêng
                localStorage.setItem("token", data.token);
                localStorage.setItem("refreshToken", data.refreshToken);
                
                set({
                    user: data,
                    token: data.token,
                    refreshToken: data.refreshToken,
                    isAuthenticated: true,
                });
            },

            setProfile: (user: User) => {
                const currentUser = get().user || {};
                set({ user: { ...currentUser, ...user } });
            },

            logout: async (deviceId?: string) => {
                try {
                    if (deviceId) {
                        await logoutApi({ deviceId });
                        console.log("✅ Logout API called successfully");
                    }
                } catch (error) {
                    console.error("❌ Logout API failed:", error);
                }

                try {
                    if (Capacitor.getPlatform() === "web") {
                        googleLogout();
                    } else {
                        await GoogleAuth.signOut();
                    }
                } catch (error) {
                    console.error("Third-party logout failed:", error);
                }

                // Xóa token và refresh token khỏi localStorage
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("registerEmail");
                localStorage.removeItem("otpLastSent");
                localStorage.removeItem("signalr-stream-storage");
                localStorage.removeItem("health-master-data-storage");
                sessionStorage.clear();

                set({
                    user: null,
                    token: null,
                    refreshToken: null,
                    isAuthenticated: false,
                });

                console.log("✅ Logout completed");
                if (Capacitor.getPlatform() === "web") {
                    location.reload();
                }
            },

            setUserAfterRegister: (data) => {
                // Lưu token và refreshToken vào localStorage riêng
                localStorage.setItem("token", data.token);
                localStorage.setItem("refreshToken", data.refreshToken);
                
                set({
                    user: data,
                    token: data.token,
                    refreshToken: data.refreshToken,
                    isAuthenticated: false,
                });
            },

            setAuthenticated: (token, refreshToken) => {
                // Lưu token và refreshToken vào localStorage riêng
                localStorage.setItem("token", token);
                localStorage.setItem("refreshToken", refreshToken);
                
                set({
                    token,
                    refreshToken,
                    isAuthenticated: !!token
                });
            },

            setUser: (user) => set({ user }),
        }),
        {
            name: 'auth-storage', 
            storage: createJSONStorage(() => localStorage),
            // Chỉ lưu user vào localStorage thông qua zustand persist
            partialize: (state) => ({
                user: state.user,
            }),
        }
    )
);