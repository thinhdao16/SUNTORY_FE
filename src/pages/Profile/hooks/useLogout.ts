import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuthStore } from '@/store/zustand/auth-store';
import useDeviceInfo from '@/hooks/useDeviceInfo';
import { useToastStore } from '@/store/zustand/toast-store';

export const useLogout = () => {
    const history = useHistory();
    const deviceInfo = useDeviceInfo();
    const logout = useAuthStore((state) => state.logout);
    const showToast = useToastStore((state) => state.showToast);

    return useCallback(async () => {
        try {
            await logout(deviceInfo.deviceId ?? undefined);
            showToast(t("Logout successful"), 500, "success");
            await history.push("/login");
        } catch (error) {
            console.error("Logout failed:", error);
            showToast(t("Logout failed"), 500, "error");
        }
    }, [logout, deviceInfo.deviceId, history, showToast]);
};