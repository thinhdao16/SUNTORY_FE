import { useEffect } from "react";
import { useAuthStore } from "@/store/zustand/auth-store";

export function useAuthGuard() {
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            useAuthStore.setState({ isAuthenticated: false, token: null, user: null });
        }
    }, []);
}