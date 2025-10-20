import React, {
    useEffect, useState, useCallback, useRef, useMemo, forwardRef, useImperativeHandle
} from 'react';
import { Capacitor } from '@capacitor/core';
import type { Album, PhotoItem } from './gallery.native';
import { getAlbums, getPhotosByAlbum } from './gallery.native';
import AppImage from '../common/AppImage';

export type NativeGalleryPickerHandle = {
    setAlbum: (albumId: string) => Promise<void>;
    reload: () => Promise<void>;
    scrollToNewest: () => void;
    submit: () => void;
    clearSelection: () => void;
};

type Props = {
    selectedIds?: string[];
    onChangeSelected?: (ids: string[], items: PhotoItem[]) => void;
    onSubmit?: (photos: PhotoItem[]) => void;
    multiSelect?: boolean;
    pageSize?: number;
    initialPageSize?: number;
    initialAlbumId?: string;
    showActionBar?: boolean;
    submitLabel?: string;

    maxHeight?: number | string;
};

const NativeGalleryPicker = forwardRef<NativeGalleryPickerHandle, Props>(function NativeGalleryPicker(
    {
        onChangeSelected,
        onSubmit,
        multiSelect = false,
        selectedIds,
        pageSize = 60,
        initialPageSize = 60,
        initialAlbumId,
        showActionBar,
        submitLabel = 'Gửi',
        maxHeight = 360,
    },
    ref
) {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [active, setActive] = useState<Album | null>(null);

    const [allPhotos, setAllPhotos] = useState<PhotoItem[]>([]);
    const [windowStart, setWindowStart] = useState(0);
    const [loading, setLoading] = useState(false);

    const [internalSelectedOrder, setInternalSelectedOrder] = useState<string[]>([]);

    const selectedOrder = useMemo(
        () => selectedIds ?? internalSelectedOrder,
        [selectedIds, internalSelectedOrder]
    );
    const selectedSet = useMemo(() => new Set(selectedOrder), [selectedOrder]);
    const selectedCount = selectedOrder.length;

    const scrollerRef = useRef<HTMLDivElement | null>(null);
    const isInitialRenderRef = useRef(true);

    const photoById = useMemo(() => {
        const map = new Map<string, PhotoItem>();
        for (const p of allPhotos) map.set(p.id, p);
        return map;
    }, [allPhotos]);

    const loadAlbums = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) return;
        const albs = await getAlbums();
        setAlbums(albs);

        if (initialAlbumId) {
            const found = albs.find(a => a.identifier === initialAlbumId);
            setActive(found || albs[0] || null);
        } else {
            setActive(albs[0] || null);
        }
    }, [initialAlbumId]);

    const applyInitialWindow = useCallback((listOldestFirst: PhotoItem[]) => {
        const start = Math.max(0, listOldestFirst.length - initialPageSize);
        setAllPhotos(listOldestFirst);
        setWindowStart(start);
        isInitialRenderRef.current = true;
    }, [initialPageSize]);

    const loadPhotos = useCallback(async (alb: Album | null) => {
        if (!alb) return;
        setLoading(true);
        try {
            const listNewestFirst = await getPhotosByAlbum(alb);
            const oldestFirst = listNewestFirst.slice().reverse();
            applyInitialWindow(oldestFirst);
        } finally {
            setLoading(false);
        }
    }, [applyInitialWindow]);

    useEffect(() => { loadAlbums(); }, [loadAlbums]);
    useEffect(() => {
        loadPhotos(active);
        if (!selectedIds) setInternalSelectedOrder([]);
    }, [active]);

    const visiblePhotos = allPhotos.slice(windowStart);

    useEffect(() => {
        if (!isInitialRenderRef.current) return;
        requestAnimationFrame(() => {
            const c = scrollerRef.current;
            if (c) c.scrollTop = c.scrollHeight;
            isInitialRenderRef.current = false;
        });
    }, [visiblePhotos.length]);

    const onScroll = useCallback(() => {
        const c = scrollerRef.current;
        if (!c) return;
        if (c.scrollTop <= 40 && windowStart > 0) {
            const prevDistanceFromBottom = c.scrollHeight - c.scrollTop;
            const more = Math.min(pageSize, windowStart);
            setWindowStart(prev => prev - more);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const cc = scrollerRef.current;
                    if (!cc) return;
                    cc.scrollTop = cc.scrollHeight - prevDistanceFromBottom;
                });
            });
        }
    }, [pageSize, windowStart]);

    const isSelected = useCallback((id: string) => selectedSet.has(id), [selectedSet]);
    const orderIndexOf = useCallback((id: string) => {
        const idx = selectedOrder.indexOf(id);
        return idx >= 0 ? idx + 1 : 0;
    }, [selectedOrder]);

    const toggleSelect = useCallback((p: PhotoItem) => {
        let nextOrder: string[];
        if (selectedSet.has(p.id)) {
            nextOrder = selectedOrder.filter(x => x !== p.id);
        } else {
            nextOrder = [...selectedOrder, p.id];
        }

        if (!selectedIds) setInternalSelectedOrder(nextOrder);

        const items = nextOrder
            .map(id => photoById.get(id))
            .filter(Boolean) as PhotoItem[];

        onChangeSelected?.(nextOrder, items);
    }, [selectedIds, selectedOrder, selectedSet, onChangeSelected, photoById]);


    useImperativeHandle(ref, () => ({
        setAlbum: async (albumId: string) => {
            const a = albums.find(x => x.identifier === albumId) || null;
            setActive(a);
            if (a) await loadPhotos(a);
        },
        reload: async () => { await loadPhotos(active); },
        scrollToNewest: () => {
            const c = scrollerRef.current;
            if (!c) return;
            c.scrollTop = c.scrollHeight;
        },
        submit: () => {
            const items = selectedOrder.map(id => photoById.get(id)).filter(Boolean) as PhotoItem[];
            onSubmit?.(items);
        },
        clearSelection: () => {
            if (!selectedIds) setInternalSelectedOrder([]);
            onChangeSelected?.([], []);
        }
    }), [albums, active, loadPhotos, selectedOrder, photoById, onSubmit, onChangeSelected, selectedIds]);

    const containerStyle = useMemo<React.CSSProperties>(() => {
        const h = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;
        return { height: h };
    }, [maxHeight]);

    if (!Capacitor.isNativePlatform()) {
        return <div className="p-4 text-sm text-gray-500">{t("Gallery chỉ hỗ trợ native.")}</div>;
    }

    const showBar = showActionBar ?? multiSelect;

    return (
        <div className="flex flex-col min-h-0 w-full" style={containerStyle}>
            <div className="flex gap-2 overflow-x-auto px-3 py-2">
                {albums.map(a => (
                    <button
                        type="button"
                        key={a.identifier}
                        onClick={() => setActive(a)}
                        className={`px-3 py-1 rounded-full border whitespace-nowrap ${active?.identifier === a.identifier
                            ? 'bg-main text-white border-main'
                            : 'border-gray-300 text-gray-700'
                            }`}
                    >
                        {a.name || 'Album'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="p-4 text-sm text-gray-500">{t("Đang tải ảnh…")}</div>
            ) : (
                <div ref={scrollerRef} onScroll={onScroll} className="flex-1 min-h-0 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-1 p-1">
                        {visiblePhotos.map(p => {
                            const sel = isSelected(p.id);
                            const order = orderIndexOf(p.id);
                            return (
                                <button
                                    key={p.id}
                                    onClick={(e) => { e.preventDefault(); toggleSelect(p); }}
                                    className="relative w-full aspect-square overflow-hidden bg-gray-100"
                                >
                                    <AppImage
                                        src={p.thumb}
                                        alt=""
                                        className="w-full h-full object-cover "
                                        fit="cover"
                                        motionClassName=" rounded-none"
                                    />
                                    {multiSelect && sel && (
                                        <div className="absolute inset-0 bg-black/30" />
                                    )}

                                    {multiSelect && sel && (
                                        <span
                                            className="absolute right-1 top-1 w-5 h-5 rounded-full bg-main text-white text-[10px] font-semibold grid place-content-center shadow"
                                        >
                                            {order}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {selectedCount > 0 && (
                <div className="absolute bottom-10 left-0 right-0   flex items-center justify-center px-6 w-full">
                    <div className="flex items-center gap-2 w-full">
                        <button
                            type='button'
                            onClick={() => {
                                const items = selectedOrder.map(id => photoById.get(id)).filter(Boolean) as PhotoItem[];
                                onSubmit?.(items);
                            }}
                            disabled={selectedCount === 0}
                            className={` py-3 text-lg font-semibold w-full rounded-lg bg-main text-white}`}
                        >
                            {submitLabel} {selectedCount > 0 ? `(${selectedCount})` : ''}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});

export default NativeGalleryPicker;
