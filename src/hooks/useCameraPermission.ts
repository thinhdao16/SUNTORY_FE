import { useState, useEffect } from "react";
import { Camera } from "@capacitor/camera";

const useCameraPermission = () => {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isWeb, setIsWeb] = useState(false);

    const checkPermission = async () => {
        const platform = navigator.userAgent;
        const isWebPlatform = !/Android|iPhone|iPad|iPod/i.test(platform);
        setIsWeb(isWebPlatform);

        if (isWebPlatform) {
            try {
                await navigator.mediaDevices.getUserMedia({ video: true });
                setHasPermission(true);
            } catch (error) {
                console.error("Web camera access denied:", error);
                setHasPermission(false);
            }
        } else {
            try {
                const status = await Camera.checkPermissions();
                setHasPermission(status.camera === "granted");
            } catch (error) {
                console.error("Native checkPermissions error:", error);
                setHasPermission(false);
            }
        }
    };

    const requestPermission = async () => {
        if (isWeb) {
            return checkPermission();
        }
        try {
            const status = await Camera.requestPermissions();
            setHasPermission(status.camera === "granted");
        } catch (error) {
            setHasPermission(false);
        }
    };

    useEffect(() => {
        checkPermission();
    }, []);

    return { hasPermission, requestPermission };
};

export default useCameraPermission;
