import { Capacitor } from "@capacitor/core";
import { useFcmToken } from "./useFcmToken";
import { useNativePush } from "./useNativePush";

export function useFcmOrNativePush(mutate?: (data: { fcmToken: string }) => void) {
    const platform = Capacitor.getPlatform();

    if (platform === "web") {
        useFcmToken(mutate);
    } else {
        useNativePush(mutate);
    }
}
