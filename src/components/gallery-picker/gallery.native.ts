import { Capacitor } from '@capacitor/core';
import { Media } from '@capacitor-community/media';
import { Filesystem, Directory } from '@capacitor/filesystem';

export type Album = { identifier: string; name: string; type: 'smart' | 'shared' | 'user' };
export type PhotoItem = {
    id: string;
    thumb: string;   
    uri?: string;  
    path?: string; 
}

export async function getAlbums(): Promise<Album[]> {
    if (!Capacitor.isNativePlatform()) return [];
    const { albums } = await Media.getAlbums();
    return albums.map(a => ({
        identifier: a.identifier,
        name: a.name,
        type: (a.type ?? 'user') as 'user' | 'smart' | 'shared',
    }));
}

export async function getPhotosIOS(albumId: string, limit = 120): Promise<PhotoItem[]> {
    const { medias } = await Media.getMedias({
        albumIdentifier: albumId,
        quantity: limit,
        thumbnailWidth: 300,
        thumbnailHeight: 300,
        types: 'photos',
    });
    return medias.map(m => ({
        id: m.identifier,
        thumb: `data:image/jpeg;base64,${m.data}`,
    }));
}

function toExternalRelativePath(absPath: string) {
    const roots = ['/storage/emulated/0/', '/sdcard/'];
    for (const root of roots) {
        if (absPath.startsWith(root)) return absPath.slice(root.length);
    }
    return absPath.replace(/^\/+/, '');
}

export async function getPhotosAndroid(albumAbsolutePath: string): Promise<PhotoItem[]> {
    const albumRel = toExternalRelativePath(albumAbsolutePath);
    const dir = await Filesystem.readdir({
        path: albumRel,
        directory: Directory.ExternalStorage,
    });

    const items = dir.files?.filter(f => /\.(jpe?g|png|webp|heic)$/i.test(f.name)) ?? [];
    const out: PhotoItem[] = [];

    for (const f of items) {
        const relFilePath = `${albumRel}/${f.name}`;

        const { uri } = await Filesystem.getUri({
            path: relFilePath,
            directory: Directory.ExternalStorage,
        });

        const webSrc = (window as any).Capacitor
            ? (window as any).Capacitor.convertFileSrc(uri)
            : uri;

        out.push({ id: relFilePath, thumb: webSrc, uri });
    }

    return out.reverse();
}

export async function getPhotosByAlbum(album: Album): Promise<PhotoItem[]> {
    return Capacitor.getPlatform() === 'android'
        ? getPhotosAndroid(album.identifier)
        : getPhotosIOS(album.identifier);
}
