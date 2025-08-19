import { useEffect } from "react";
import { requestForToken } from "@/lib/firebase";
import { Preferences } from "@capacitor/preferences";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useUpdateNewDevice } from "./device/useDevice";
import { FCM_KEY } from "@/constants/global";


export function useUpdateFcmToken() {
    const updateNewDevice = useUpdateNewDevice();
    const deviceInfo = useDeviceInfo();

    useEffect(() => {
        const updateToken = async () => {
            const token = await requestForToken();
            if (token) {
                const stored = (await Preferences.get({ key: FCM_KEY })).value;
                if (stored !== token) {
                    await Preferences.set({ key: FCM_KEY, value: token });
                    updateNewDevice.mutate({
                        deviceId: deviceInfo.deviceId,
                        firebaseToken: token,
                    });
                }
            }
        };

        updateToken();

    }, [updateNewDevice, deviceInfo]);
}
