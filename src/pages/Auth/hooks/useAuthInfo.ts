import { useQuery } from "react-query";
import { getInfo as getInfoService } from "@/services/auth/auth-service";
import { useAuthStore } from "@/store/zustand/auth-store";
import { User } from "@/types/user";

export const useAuthInfo = () => {

    const { token, setProfile } = useAuthStore.getState();
    return useQuery(
        "authInfo",
        () => getInfoService(),
        {
            enabled: !!token,
            select: (res: any) => res.data,
            onSuccess: (user: User) => {
                setProfile?.(user);
            },
            onError: (error) => console.error("Get-info error:", error),
        }
    );
};