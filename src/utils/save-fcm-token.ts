import { Preferences } from "@capacitor/preferences";
import { FCM_KEY } from "@/constants/global";

export async function saveFcmToken(token: string) {
    if (!token) return;
    await Preferences.set({ key: FCM_KEY, value: token });
}
