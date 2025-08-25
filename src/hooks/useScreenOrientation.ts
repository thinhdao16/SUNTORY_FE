import { ScreenOrientation } from '@capacitor/screen-orientation';
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export const useScreenOrientation = () => {
    useEffect(() => {
        const lockOrientation = async () => {
            if (Capacitor.isNativePlatform()) {
                try {
                    await ScreenOrientation.lock({ orientation: 'portrait' });
                } catch (error) {
                    console.error('Failed to lock orientation:', error);
                }
            }
        };

        lockOrientation();

        return () => {
            if (Capacitor.isNativePlatform()) {
                ScreenOrientation.unlock().catch(console.error);
            }
        };
    }, []);
};