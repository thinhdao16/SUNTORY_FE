import { useEffect } from "react";
import useSafeArea from "./useSafeArea";
import { StatusBar } from "@capacitor/status-bar";
import { isPlatform } from "@ionic/react";

const useAppInit = () => {
    useSafeArea();

    useEffect(() => {
        const onStatusTap = () => {
            console.log("statusbar tapped");
        };
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