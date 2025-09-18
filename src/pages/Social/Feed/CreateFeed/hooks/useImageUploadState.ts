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
            imageUploadManager.current = new ImageUploadManager({
                uploadFunction: uploadSocialFiles,
                onProgress: (imageIndex, progress) => {
                    if (progress === 'success' || progress === 'error') {
                        // Update only the specific image that changed
                        setImages(prev => {
                            const updatedImages = [...prev];
                            const managerImages = imageUploadManager.current!.getImages();
                            if (managerImages[imageIndex]) {
                                updatedImages[imageIndex] = managerImages[imageIndex];
                            }
                            return updatedImages;
                        });
                    }
                },
                onComplete: () => {
                    setIsUploading(false);
                }
            }, imageUploadMutation);
        }
    }, [imageUploadMutation]);

    const addImages = useCallback(async (newImages: ImageItem[]) => {
        initializeManager();
        
        setImages(prev => [...prev, ...newImages]);
        setIsUploading(true);

        // Upload through manager
        const files = newImages.map(img => img.file);
        await imageUploadManager.current!.addFiles(files);
    }, [initializeManager]);

    // Add audio item
    const addAudioItem = useCallback((audioBlob: Blob, filename?: string, serverUrl?: string, serverName?: string) => {
        initializeManager();
        
        const audioItem = imageUploadManager.current!.createAudioItem(audioBlob, filename, serverUrl, serverName);
        setImages(prev => [...prev, audioItem]);
    }, [initializeManager]);

    // Remove image
    const removeImage = useCallback((index: number) => {
        setImages(prev => {
            const newImages = [...prev];
            // Revoke object URL to prevent memory leaks
            URL.revokeObjectURL(newImages[index].localUrl);
            newImages.splice(index, 1);
            return newImages;
        });

        // Also remove from manager
        if (imageUploadManager.current) {
            const managerImages = imageUploadManager.current.getImages();
            managerImages.splice(index, 1);
        }
    }, []);

    // Clear all images
    const clearImages = useCallback(() => {
        // Revoke all object URLs
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
        clearImages,
        imageUploadManager: imageUploadManager.current
    };
};
