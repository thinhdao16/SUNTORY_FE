import { useState, useRef, useCallback } from 'react';
import { ImageUploadManager, ImageItem } from '@/utils/imageUpload';
import { uploadSocialFiles } from '@/services/social/social-upload-service';
import { useImageUpload } from '@/pages/Social/Feed/hooks/useUploadMutations';

export const useImageUploadState = () => {
    const [images, setImages] = useState<ImageItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const imageUploadManager = useRef<ImageUploadManager | null>(null);
    const imageUploadMutation = useImageUpload();

    const initializeManager = useCallback(() => {
        if (!imageUploadManager.current) {
            imageUploadManager.current = new ImageUploadManager(
                {
                    uploadFunction: uploadSocialFiles,
                    onProgress: (imageIndex, progress) => {
                        const mgr = imageUploadManager.current!.getImages();
                        const mgrItem = mgr[imageIndex];
                        if (!mgrItem) return;
                        setImages(prev => {
                            const next = [...prev];
                            const idx = next.findIndex(it =>
                                (it.file && mgrItem.file && it.file === mgrItem.file) ||
                                (it.localUrl && mgrItem.localUrl && it.localUrl === mgrItem.localUrl) ||
                                (!!it.filename && !!mgrItem.filename && it.filename === mgrItem.filename)
                            );
                            if (idx >= 0) {
                                next[idx] = mgrItem;
                            } else {
                                next.push(mgrItem);
                            }
                            return next;
                        });
                    },
                    onComplete: () => setIsUploading(false)
                },
                imageUploadMutation
            );
        }
    }, [imageUploadMutation]);

    const addImages = useCallback(async (newImages: ImageItem[]) => {
        initializeManager();
        setImages(prev => [...prev, ...newImages]);
        setIsUploading(true);
        await imageUploadManager.current!.addFiles(newImages.map(img => img.file));
    }, [initializeManager]);


    const addAudioItem = useCallback((audioBlob: Blob, filename?: string, serverUrl?: string, serverName?: string) => {
        initializeManager();
    
        setImages(prev => {
            const filteredImages = prev.filter(item => item.mediaType !== 'audio');
            const audioItem = imageUploadManager.current!.createAudioItem(audioBlob, filename, serverUrl, serverName);
            return [...filteredImages, audioItem];
        });
    }, [initializeManager]);

    const removeImage = useCallback((index: number) => {
        setImages(prev => {
            const next = [...prev];
            const target = next[index];
            if (target?.localUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(target.localUrl);
            }
            next.splice(index, 1);

            if (imageUploadManager.current) {
                const mgr = imageUploadManager.current.getImages();
                const mIdx = mgr.findIndex(it =>
                    (target.file && it.file && target.file === it.file) ||
                    (target.localUrl && it.localUrl && target.localUrl === it.localUrl) ||
                    (!!target.filename && !!it.filename && target.filename === it.filename)
                );
                if (mIdx >= 0) mgr.splice(mIdx, 1);
            }
            return next;
        });
    }, []);


    const reorderImages = useCallback((newImages: ImageItem[]) => {
        setImages(newImages);
        // Update the manager's internal order as well
        if (imageUploadManager.current) {
            imageUploadManager.current.reorderImages(newImages);
        }
    }, []);

    const clearImages = useCallback(() => {
        images.forEach(img => URL.revokeObjectURL(img.localUrl));
        setImages([]);
        imageUploadManager.current?.clear();
    }, [images]);

    return {
        images,
        setImages,
        isUploading,
        setIsUploading,
        addImages,
        addAudioItem,
        removeImage,
        reorderImages,
        clearImages,
        imageUploadManager: imageUploadManager.current
    };
};
