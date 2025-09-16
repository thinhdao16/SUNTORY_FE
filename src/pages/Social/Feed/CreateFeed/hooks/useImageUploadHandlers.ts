import React, { useCallback } from 'react';
import { ImageItem, getImageDimensions, captureFromCamera, selectFromGallery } from '@/utils/imageUpload';

interface UseImageUploadHandlersProps {
    addImages: (newImages: ImageItem[]) => Promise<void>;
    clearAudio: () => void;
}

export const useImageUploadHandlers = ({ addImages, clearAudio }: UseImageUploadHandlersProps) => {
    
    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        clearAudio();

        const newImages: ImageItem[] = [];
        for (const file of files) {
            try {
                const dimensions = await getImageDimensions(file);
                newImages.push({
                    file,
                    localUrl: URL.createObjectURL(file),
                    isUploading: true,
                    width: dimensions.width,
                    height: dimensions.height,
                    mediaType: 'image'
                });
            } catch (error) {
                newImages.push({
                    file,
                    localUrl: URL.createObjectURL(file),
                    isUploading: true,
                    mediaType: 'image'
                });
            }
        }

        await addImages(newImages);
    }, [addImages, clearAudio]);

    const handleCameraCapture = useCallback(async () => {
        const file = await captureFromCamera();
        if (!file) return;

        clearAudio();

        try {
            const dimensions = await getImageDimensions(file);
            const newImage: ImageItem = {
                file,
                localUrl: URL.createObjectURL(file),
                isUploading: true,
                width: dimensions.width,
                height: dimensions.height,
                mediaType: 'image'
            };
            await addImages([newImage]);
        } catch (error) {
            const newImage: ImageItem = {
                file,
                localUrl: URL.createObjectURL(file),
                isUploading: true,
                mediaType: 'image'
            };
            await addImages([newImage]);
        }
    }, [addImages, clearAudio]);

    const handleGallerySelect = useCallback(async () => {
        const files = await selectFromGallery(true);
        if (files.length === 0) return;

        clearAudio();
        const newImages: ImageItem[] = [];
        for (const file of files) {
            try {
                const dimensions = await getImageDimensions(file);
                newImages.push({
                    file,
                    localUrl: URL.createObjectURL(file),
                    isUploading: true,
                    width: dimensions.width,
                    height: dimensions.height,
                    mediaType: 'image'
                });
            } catch (error) {
                newImages.push({
                    file,
                    localUrl: URL.createObjectURL(file),
                    isUploading: true,
                    mediaType: 'image'
                });
            }
        }

        await addImages(newImages);
    }, [addImages, clearAudio]);

    return {
        handleImageUpload,
        handleCameraCapture,
        handleGallerySelect
    };
};
