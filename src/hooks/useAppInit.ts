import { useEffect } from "react";
import useSafeArea from "./useSafeArea";
import { StatusBar } from "@capacitor/status-bar";
import { isPlatform } from "@ionic/react";
import { useFcmOrNativePush } from "./useFcmOrNativePush";
import { useScreenOrientation } from "./useScreenOrientation";
const useAppInit = () => {
    useSafeArea();
    useScreenOrientation();
    useFcmOrNativePush((data) => {
        console.log("🔥 Push token:", data.fcmToken);
    });

    useEffect(() => {
        const onStatusTap = () => { };
        window.addEventListener("statusTap", onStatusTap);

        const setStatusBar = async () => {
            if (isPlatform("capacitor")) {
                await StatusBar.setOverlaysWebView({ overlay: true });
            }
        };
        setStatusBar();

        return () => {
            window.removeEventListener("statusTap", onStatusTap);
        };
    }, []);
};


export default useAppInit;