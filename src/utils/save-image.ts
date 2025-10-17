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
        // The plugin expects a real album identifier, not a name
        let identifier: any = await resolveAlbumIdentifierByName(albumIdentifier);
        if (identifier === null || identifier === undefined) {
            identifier = await findFallbackAlbumIdentifier();
        }
        if (identifier === null || identifier === undefined) {
            throw new Error('NO_ALBUM');
        }

        // Always pass a valid identifier on Android
        await (Media as any).savePhoto({
            path: toDataUrl(dataUrlOrBase64),
            fileName: stripExt(fileName),
            albumIdentifier: identifier,
        });

        console.log(`[saveImage] Saved to Photo Gallery (album=${String(identifier)})`);
        return { ok: true, platform: 'native' as const, via: 'gallery' as const };
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
