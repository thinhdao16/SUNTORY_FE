import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

export type Platform = "ios" | "android" | "web";

export interface PlatformInfo {
    platform: Platform;
    isNative: boolean;
    isWeb: boolean;
    isIOS: boolean;
    isAndroid: boolean;
}

/**
 * Hook to detect current platform (iOS, Android, or Web)
 * @returns PlatformInfo object with platform details
 *
 * @example
 * const { platform, isIOS, isAndroid, isWeb, isNative } = usePlatform();
 *
 * if (isIOS) {
 *   // iOS-specific logic
 * }
 */
export function usePlatform(): PlatformInfo {
    const [platformInfo, setPlatformInfo] = useState<PlatformInfo>(() => {
        const platform = Capacitor.getPlatform() as Platform;
        const isNative = Capacitor.isNativePlatform();

        return {
            platform,
            isNative,
            isWeb: platform === "web",
            isIOS: platform === "ios",
            isAndroid: platform === "android",
        };
    });

    useEffect(() => {
        // Re-check platform on mount (in case it changes during hot reload in dev)
        const platform = Capacitor.getPlatform() as Platform;
        const isNative = Capacitor.isNativePlatform();

        setPlatformInfo({
            platform,
            isNative,
            isWeb: platform === "web",
            isIOS: platform === "ios",
            isAndroid: platform === "android",
        });
    }, []);

    return platformInfo;
}

/**
 * Get platform synchronously without hook
 * Useful for non-component code
 */
export function getPlatform(): Platform {
    return Capacitor.getPlatform() as Platform;
}

/**
 * Check if running on native platform
 */
export function isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
}

/**
 * Check if running on specific platform
 */
export function isPlatform(platform: Platform): boolean {
    return Capacitor.getPlatform() === platform;
}
