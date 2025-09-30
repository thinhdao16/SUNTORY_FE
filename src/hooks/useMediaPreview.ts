import { useState } from 'react';

interface MediaItem {
    src: string;
    serverSrc?: string;
    type: 'image' | 'video';
    name?: string;
}

export const useMediaPreview = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const openPreview = (items: MediaItem[], initialIndex: number = 0) => {
        setMediaItems(items);
        setCurrentIndex(initialIndex);
        setIsOpen(true);
    };

    const closePreview = () => {
        setIsOpen(false);
        setMediaItems([]);
        setCurrentIndex(0);
    };

    const openImagePreview = (images: string[], initialIndex: number = 0) => {
        const items: MediaItem[] = images.map(src => ({
            src,
            type: 'image' as const
        }));
        openPreview(items, initialIndex);
    };

    return {
        isOpen,
        mediaItems,
        currentIndex,
        openPreview,
        closePreview,
        openImagePreview
    };
};
