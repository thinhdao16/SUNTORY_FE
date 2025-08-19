import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Media } from '@capacitor-community/media'; 

type SaveImageParams = {
    dataUrlOrBase64: string;   
    fileName?: string;        
    albumIdentifier?: string;  
};

const toDataUrl = (s: string) =>
    s.startsWith('data:') ? s : `data:image/png;base64,${s}`;

const stripExt = (name: string) => name.replace(/\.[^/.]+$/, '');

export async function saveImage(params: SaveImageParams) {
    const { dataUrlOrBase64, fileName = 'image.png', albumIdentifier } = params;

    if (!Capacitor.isNativePlatform()) {
        const a = document.createElement('a');
        a.href = toDataUrl(dataUrlOrBase64);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return { ok: true, platform: 'web' as const };
    }

    try {
        await Media.savePhoto({
            path: toDataUrl(dataUrlOrBase64),      
            fileName: stripExt(fileName),          
            ...(albumIdentifier ? { albumIdentifier } : {}),
        });
        return { ok: true, platform: 'native' as const, via: 'media' as const };
    } catch (e) {
        console.warn('[saveImage] savePhoto failed, fallback Filesystem+Share', e);
    }

    const base64 = dataUrlOrBase64.startsWith('data:')
        ? dataUrlOrBase64.split(',')[1] ?? ''
        : dataUrlOrBase64;

    const res = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
    });

    await Share.share({
        title: 'Save image',
        text: 'Save or share this image',
        url: res.uri,
        dialogTitle: 'Save',
    });

    return { ok: true, platform: 'native' as const, via: 'filesystem+share' as const, uri: res.uri };
}
