import { Capacitor } from "@capacitor/core";
import type { PhotoItem } from "./gallery.native";

function dataUrlToFile(dataUrl: string, filename: string): File {
    const [meta, b64] = dataUrl.split(",");
    const mime = /data:(.*?);base64/.exec(meta)?.[1] || "image/jpeg";
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new File([bytes], filename, { type: mime });
}

export async function photoItemToFile(p: PhotoItem): Promise<File> {
    const platform = Capacitor.getPlatform();

    if (platform === "android" && p.uri) {
        const webPath = (window as any).Capacitor?.convertFileSrc?.(p.uri) ?? p.uri;
        const blob = await (await fetch(webPath)).blob();
        const ext = (blob.type.split("/")[1] || "jpg").toLowerCase();
        return new File([blob], `${p.id}.${ext}`, { type: blob.type });
    }

    if (platform === "ios" && p.path) {
        const webPath = (window as any).Capacitor?.convertFileSrc?.(p.path) ?? p.path;
        const blob = await (await fetch(webPath)).blob();
        const ext = (blob.type.split("/")[1] || "jpg").toLowerCase();
        return new File([blob], `${p.id}.${ext}`, { type: blob.type });
    }

    if (p.thumb?.startsWith("data:")) {
        return dataUrlToFile(p.thumb, `${p.id}.jpg`);
    }

    const blob = await (await fetch(p.thumb)).blob();
    const ext = (blob.type.split("/")[1] || "jpg").toLowerCase();
    return new File([blob], `${p.id}.${ext}`, { type: blob.type });
}
