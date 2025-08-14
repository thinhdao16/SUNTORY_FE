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
        const dataUrl = toDataUrl(dataUrlOrBase64);
        const ua = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac OS X') && 'ontouchend' in document);

        const fetchBlob = async () => {
            const res = await fetch(dataUrl);
            return await res.blob();
        };

        try {
            const blob = await fetchBlob();
            const mime = blob.type || 'image/png';
            const file = new File([blob], fileName, { type: mime });
            const canShareFiles = (navigator as any).canShare && (navigator as any).canShare({ files: [file] });

            if (canShareFiles) {
                await (navigator as any).share({ files: [file], title: fileName, text: 'Save or share this image' });
                return { ok: true, platform: 'web' as const, via: 'web-share' as const };
            }
            if ('showSaveFilePicker' in window) {
                const handle = await (window as any).showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{ description: 'Image', accept: { [mime]: [`.${fileName.split('.').pop() || 'png'}`] } }],
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                return { ok: true, platform: 'web' as const, via: 'file-system-access' as const };
            }

            if (isIOS) {
                const viewer = window.open('about:blank', '_blank', 'noopener,noreferrer');
                if (!viewer) {
                    const a = document.createElement('a');
                    a.href = dataUrl;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    return { ok: true, platform: 'web' as const, via: 'download-fallback' as const };
                }

                viewer.document.write(`
        <!doctype html><meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${fileName.replace(/</g, '&lt;')}</title>
        <style>html,body{margin:0;height:100%;background:#000;color:#fff;display:flex;}
        .t{margin:auto;font-family:-apple-system,system-ui;font-size:14px;opacity:.8}</style>
        <div class="t">Loading image…</div>
      `);
                viewer.document.close();

                const blobUrl = URL.createObjectURL(blob);
                viewer.location.replace(blobUrl);
                const interval = setInterval(() => {
                    if (viewer.closed) {
                        clearInterval(interval);
                        URL.revokeObjectURL(blobUrl);
                    }
                }, 2000);

                return { ok: true, platform: 'web' as const, via: 'ios-open-blob' as const };
            }

            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return { ok: true, platform: 'web' as const, via: 'download' as const };
        } catch {
            // nếu fetch blob lỗi (hiếm khi với dataURL), vẫn thử a[download]
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return { ok: true, platform: 'web' as const, via: 'download-error-fallback' as const };
        }
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
