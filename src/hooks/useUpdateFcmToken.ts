import { useEffect, useCallback, useRef } from "react";
import { requestForToken } from "@/lib/firebase";
import { Preferences } from "@capacitor/preferences";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useUpdateNewDevice } from "./device/useDevice";
import { FCM_KEY } from "@/constants/global";


export function useUpdateFcmToken(autoRun: boolean = false) {
    const updateNewDevice = useUpdateNewDevice();
    const deviceInfo = useDeviceInfo();

    const isRunningRef = useRef(false);

    const updateToken = useCallback(async (force: boolean = false) => {
        if (isRunningRef.current) return;
        isRunningRef.current = true;
        try {
            const fcmToken = await requestForToken();
            if (!fcmToken || !deviceInfo?.deviceId) return;

            const stored = (await Preferences.get({ key: FCM_KEY })).value;
            if (force || stored !== fcmToken) {
                await Preferences.set({ key: FCM_KEY, value: fcmToken });
                await updateNewDevice.mutateAsync({
                    deviceId: deviceInfo.deviceId,
                    firebaseToken: fcmToken,
                });
            }
        } finally {
            isRunningRef.current = false;
        }
    }, [deviceInfo?.deviceId, updateNewDevice]);

    useEffect(() => {
        if (autoRun) {
            updateToken();
        }
    }, [autoRun, deviceInfo?.deviceId, updateToken]);

    return updateToken;
}
