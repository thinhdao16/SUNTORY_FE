import { useQuery } from "react-query";
import { getInfo as getInfoService } from "@/services/auth/auth-service";
import { useAuthStore } from "@/store/zustand/auth-store";
import { User } from "@/types/user";
import { useUpdateFcmToken } from "@/hooks/useUpdateFcmToken";
import useDeviceInfo from "@/hooks/useDeviceInfo";

export const useAuthInfo = () => {
    const { token, setProfile } = useAuthStore.getState();
    const deviceInfo: { deviceId: string | null, language: string | null } = useDeviceInfo();
    return useQuery(
        ["authInfo", deviceInfo],
        () => getInfoService(deviceInfo?.deviceId || ''),
        {
            enabled: !!token || !deviceInfo,
            select: (res: any) => res.data,
            onSuccess: async (user: User) => {
                setProfile?.(user);
                const currentDevice = user?.devices?.find((device: { deviceId: string | null }) => device.deviceId === deviceInfo.deviceId);
                if (currentDevice) {
                    if (!currentDevice.firebaseToken || currentDevice.firebaseToken.trim() === '') {
                        await useUpdateFcmToken();
                    }
                }
            },
            onError: (error) => console.error("Get-info error:", error),
        }
    );
};