import { Capacitor } from '@capacitor/core';
import { Media } from '@capacitor-community/media'; 

type SaveImageParams = {
    dataUrlOrBase64: string;   
    fileName?: string;        
    albumIdentifier?: string;  
};

const toDataUrl = (s: string) =>
    s.startsWith('data:') ? s : `data:image/png;base64,${s}`;

const stripExt = (name: string) => name.replace(/\.[^/.]+$/, '');

// Helpers for filename/extensions
const hasExt = (name: string) => /\.[^/.]+$/.test(name);
function extFromDataUrl(dataUrlOrBase64: string): string | null {
    try {
        if (!dataUrlOrBase64.startsWith('data:')) return null;
        const m = /^data:([^;]+);base64,/.exec(dataUrlOrBase64);
        const mime = m?.[1] || '';
        if (!mime) return null;
        if (mime.includes('png')) return 'png';
        if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
        if (mime.includes('webp')) return 'webp';
        if (mime.includes('gif')) return 'gif';
        return null;
    } catch {
        return null;
    }
}
function ensureFileNameWithExt(fileName: string, dataUrlOrBase64: string): string {
    if (hasExt(fileName)) return fileName;
    const ext = extFromDataUrl(dataUrlOrBase64) || 'png';
    const base = stripExt(fileName);
    return `${base}.${ext}`;
}

// Resolve album identifier by name; create album if missing. Returns identifier or null.
async function resolveAlbumIdentifierByName(name: string): Promise<string | null> {
    try {
        const list: any = await (Media as any).getAlbums?.();
        const albums: any[] = list?.albums ?? list ?? [];
        const found = albums.find((a: any) => String(a?.name).toLowerCase() === String(name).toLowerCase());
        if (found) {
            const id = found.identifier ?? found.id ?? found.localIdentifier ?? found.bucketId;
            if (id !== undefined && id !== null) return id; // keep original type
        }
    } catch {}

    // Try to create the album
    try {
        const created: any = await (Media as any).createAlbum?.({ name });
        // Some implementations return the created album; try to read identifier
        if (created) {
            const id = created.identifier ?? created.id ?? created.localIdentifier ?? created.bucketId;
            if (id !== undefined && id !== null) return id;
        }
    } catch {
        // ignore (may already exist)
    }

    // Re-fetch after create attempt
    try {
        const list2: any = await (Media as any).getAlbums?.();
        const albums2: any[] = list2?.albums ?? list2 ?? [];
        const found2 = albums2.find((a: any) => String(a?.name).toLowerCase() === String(name).toLowerCase());
        if (found2) {
            const id2 = found2.identifier ?? found2.id ?? found2.localIdentifier ?? found2.bucketId;
            if (id2 !== undefined && id2 !== null) return id2;
        }
    } catch {}

    return null;
}

// Try to find a reasonable fallback album identifier if the preferred one is unavailable
async function findFallbackAlbumIdentifier(): Promise<any | null> {
    try {
        const list: any = await (Media as any).getAlbums?.();
        const albums: any[] = list?.albums ?? list ?? [];
        if (!albums?.length) return null;
        const preferred = ['Pictures', 'Camera', 'DCIM', 'Screenshots', 'Download'];
        for (const name of preferred) {
            const match = albums.find((a: any) => String(a?.name).toLowerCase() === name.toLowerCase());
            if (match) {
                const id = match.identifier ?? match.id ?? match.localIdentifier ?? match.bucketId;
                if (id !== undefined && id !== null) return id;
            }
        }
        // Fall back to the first album
        const first = albums[0];
        const id = first?.identifier ?? first?.id ?? first?.localIdentifier ?? first?.bucketId;
        if (id !== undefined && id !== null) return id;
    } catch {}
    return null;
}

function isLikelyIOSorSafari(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    
    // Check for iOS devices
    const isIOS = /iPad|iPhone|iPod/.test(ua) || 
                  (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
    
    // Check for Safari browser (but not Chrome/Firefox on iOS)
    const isSafari = /Safari\//.test(ua) && 
                     !/Chrome\//.test(ua) && 
                     !/CriOS\//.test(ua) && 
                     !/FxiOS\//.test(ua) &&
                     !/Edg/.test(ua);
    
    // Check for WKWebView (Capacitor/Cordova on iOS)
    const isWKWebView = isIOS && /AppleWebKit/.test(ua);
    
    return isIOS || isSafari || isWKWebView;
}

/**
 * Save image to Photo Gallery (Native) or download (Web)
 * Priority: Always try to save to Photo Gallery first on native platforms
 */
export async function saveImage(params: SaveImageParams) {
    const { dataUrlOrBase64, fileName = 'image.png', albumIdentifier = 'WayJet' } = params;

    // Web platform: direct download with Safari/iOS handling
    if (!Capacitor.isNativePlatform()) {
        const href = toDataUrl(dataUrlOrBase64);

        // iOS/Safari: open in new tab with formatted HTML for better UX
        // User must manually long-press the image and select "Save Image"
        const isiOS = isLikelyIOSorSafari();
        console.log('[saveImage] iOS/Safari detected:', isiOS, 'UA:', navigator.userAgent);
        if (isiOS) {
            try {
                // Try to open popup with HTML content
                const popup = window.open('', '_blank');
                console.log('[saveImage] Popup opened:', !!popup, 'Closed:', popup?.closed);
                if (popup && !popup.closed) {
                    try {
                        popup.document.open();
                        popup.document.write(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${fileName}</title></head><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;"><img src="${href}" alt="${fileName}" style="max-width:100%;max-height:100vh;display:block;" /></body></html>`);
                        popup.document.close();
                        return { ok: true, platform: 'web' as const, via: 'open' as const };
                    } catch (e) {
                        // Cross-origin or document access issue, close and fallback
                        popup.close();
                    }
                }
            } catch (e) {
                console.warn('[saveImage] Popup blocked or failed:', e);
            }
            
            // Fallback: Simple anchor with target blank (will open image in new tab)
            console.log('[saveImage] Using fallback anchor tag for iOS');
            const a = document.createElement('a');
            a.href = href;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return { ok: true, platform: 'web' as const, via: 'open' as const };
        }

        // Other browsers: direct download
        const a = document.createElement('a');
        a.href = href;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return { ok: true, platform: 'web' as const, via: 'download' as const };
    }

    // Native platform: Save to Photo Gallery
    try {
        const platform = Capacitor.getPlatform();
        const path = toDataUrl(dataUrlOrBase64);
        let identifier: any = await resolveAlbumIdentifierByName(albumIdentifier);
        if (identifier === null || identifier === undefined) {
            identifier = await findFallbackAlbumIdentifier();
        }

        // Build base options; on Android, keep extension to help MediaStore MIME
        const baseOpts: any = {
            path,
            fileName: platform === 'android' ? ensureFileNameWithExt(fileName, dataUrlOrBase64) : stripExt(fileName),
        };

        // Try with album identifier first if available
        if (identifier !== null && identifier !== undefined) {
            try {
                await (Media as any).savePhoto({ ...baseOpts, albumIdentifier: identifier });
                console.log(`[saveImage] Saved to Photo Gallery (album=${String(identifier)})`);
                return { ok: true, platform: 'native' as const, via: 'gallery' as const };
            } catch (err) {
                // On Android, some devices may fail with album; fall back to no album
                if (platform !== 'android') throw err;
                console.warn('[saveImage] Android save with album failed, retrying without albumIdentifier');
            }
        }

        // If no identifier or failed, attempt Android save without album
        if (platform === 'android') {
            await (Media as any).savePhoto(baseOpts);
            console.log('[saveImage] Saved to Photo Gallery (Android, no albumIdentifier)');
            return { ok: true, platform: 'native' as const, via: 'gallery' as const };
        }

        // iOS requires a valid album identifier to categorize; if none, error
        throw new Error('NO_ALBUM');
    } catch (e: any) {
        console.error('[saveImage] Failed to save to gallery:', e);

        // Handle missing permission explicitly
        if (e?.message?.toLowerCase?.().includes('permission')) {
            throw new Error('PERMISSION_DENIED');
        }

        // If identifier issues or no album, surface a specific error
        if (e?.message === 'NO_ALBUM' || String(e?.message).includes('Album identifier')) {
            throw new Error('NO_ALBUM');
        }

        throw new Error('SAVE_FAILED');
    }
}
