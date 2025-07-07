import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import ENV from "@/config/env";

export const GOOGLE_WEB_CLIENT_ID = ENV.GOOGLE_API_KEY;

export function initGoogleAuth() {

    if (Capacitor.getPlatform && Capacitor.getPlatform() !== 'web') {
        GoogleAuth.initialize({
            clientId: GOOGLE_WEB_CLIENT_ID,
            scopes: ['profile', 'email'],
            grantOfflineAccess: true,
        });
    }
}