import { useEffect } from "react";
import useSafeArea from "./useSafeArea";
import { StatusBar, Style } from "@capacitor/status-bar";
import { isPlatform } from "@ionic/react";
const useAppInit = () => {
    useSafeArea();


    // StatusBar.setOverlaysWebView({ overlay: true }); // hoặc false nếu muốn đẩy nội dung xuống
    // StatusBar.setBackgroundColor({ color: '#000000' });
    // StatusBar.setStyle({ style: Style.Light }); // hoặc .Dark

    useEffect(() => {
        const onStatusTap = () => {
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