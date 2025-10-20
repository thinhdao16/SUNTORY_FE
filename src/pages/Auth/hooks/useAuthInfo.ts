import { useQuery } from "react-query";
import { getInfo as getInfoService } from "@/services/auth/auth-service";
import { useAuthStore } from "@/store/zustand/auth-store";
import { User } from "@/types/user";
import { useUpdateFcmToken } from "@/hooks/useUpdateFcmToken";
import useDeviceInfo from "@/hooks/useDeviceInfo";

export const useAuthInfo = () => {
    const { token, setProfile } = useAuthStore.getState();
    const deviceInfo = useDeviceInfo();
    const deviceId = deviceInfo?.deviceId || null;
    const enabled = Boolean(token) && Boolean(deviceId);
    
    const updateFcmToken = useUpdateFcmToken();
    
    return useQuery(
        ["authInfo", deviceId],
        () => getInfoService(deviceId as string),
        {
            enabled,
            select: (res: any) => res.data,
            onSuccess: async (user: User) => {
                setProfile?.(user);
                const currentDevice = user?.devices?.find((device: {deviceId: string | null }) => device.deviceId === deviceId);
                if (currentDevice) {
                    if (!currentDevice.firebaseToken || currentDevice.firebaseToken.trim() === '' || !currentDevice.firebaseToken) {
                        await updateFcmToken(true);
                    }
                }
            },
            onError: (error) => console.error("Get-info error:", error),
        }
    );
};