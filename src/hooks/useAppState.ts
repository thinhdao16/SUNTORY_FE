import { useEffect } from 'react';
import { App, AppState } from '@capacitor/app';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';

export const useAppState = (onForeground: () => void) => {
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            let listenerHandle: PluginListenerHandle | null = null;
            App.addListener('appStateChange', (state: AppState) => {
                if (state.isActive) {
                    onForeground();
                }
            }).then(handle => {
                listenerHandle = handle;
            });

            return () => {
                if (listenerHandle) {
                    listenerHandle.remove();
                }
            };
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                onForeground();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [onForeground]);
};