export type MediaType = 'image' | 'audio' | 'video';

export interface ImageItem {
    id?: string;
    file: File;
    localUrl: string;
    serverUrl?: string;
    serverName?: string;
    isUploading: boolean;
    uploadError?: string;
    width?: number;
    height?: number;
    filename?:string;
    url?: string;
    mediaType: MediaType;
    isExisting?: boolean;
    isUploaded?: boolean;
}

export interface ImageUploadOptions {
    onProgress?: (imageIndex: number, progress: 'uploading' | 'success' | 'error') => void;
    onComplete?: (images: ImageItem[]) => void;
    uploadFunction: (params: { files: File[], width?: number, height?: number }) => Promise<any>;
}

/**
 * Reusable image upload utility that handles:
 * - Local preview creation
 * - File upload with progress tracking
 * - Error handling
 * - Memory cleanup
 */
export class ImageUploadManager {
    private images: ImageItem[] = [];
    private options: ImageUploadOptions;
    private uploadMutation?: any;

    constructor(options: ImageUploadOptions, uploadMutation?: any) {
        this.options = options;
        this.uploadMutation = uploadMutation;
    }

    /**
     * Add files and start upload process
     */
    async addFiles(files: File[]): Promise<ImageItem[]> {
        if (files.length === 0) return this.images;

        // Create new image items with local URLs and dimensions
        const newImages: ImageItem[] = [];
        
        for (const file of files) {
            try {
                let dimensions;
                let mediaType: MediaType;
                
                if (file.type.startsWith('video/')) {
                    dimensions = await getVideoDimensions(file);
                    mediaType = 'video';
                } else if (file.type.startsWith('image/')) {
                    dimensions = await getImageDimensions(file);
                    mediaType = 'image';
                } else {
                    // Default to image for unknown types
                    dimensions = await getImageDimensions(file);
                    mediaType = 'image';
                }
                
                newImages.push({
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    file,
                    localUrl: URL.createObjectURL(file),
                    isUploading: true,
                    width: dimensions.width,
                    height: dimensions.height,
                    mediaType
                });
            } catch (error) {
                // Fallback without dimensions
                const mediaType: MediaType = file.type.startsWith('video/') ? 'video' : 'image';
                newImages.push({
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    file,
                    localUrl: URL.createObjectURL(file),
                    isUploading: true,
                    mediaType
                });
            }
        }

        this.images = [...this.images, ...newImages];

        // Upload each file
        await this.uploadFiles(files, this.images.length - files.length);

        return this.images;
    }

    /**
     * Add single file (useful for camera capture)
     */
    async addFile(file: File): Promise<ImageItem[]> {
        return this.addFiles([file]);
    }

    /**
     * Create image item with dimensions
     */
    async createImageItem(file: File): Promise<ImageItem> {
        try {
            let dimensions;
            let mediaType: MediaType;
            
            if (file.type.startsWith('video/')) {
                dimensions = await getVideoDimensions(file);
                mediaType = 'video';
            } else if (file.type.startsWith('image/')) {
                dimensions = await getImageDimensions(file);
                mediaType = 'image';
            } else {
                dimensions = await getImageDimensions(file);
                mediaType = 'image';
            }
            
            const newItem: ImageItem = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                file,
                localUrl: URL.createObjectURL(file),
                isUploading: false,
                width: dimensions?.width,
                height: dimensions?.height,
                mediaType,
                filename: file.name
            };
            
            return newItem;
        } catch (error) {
            const mediaType: MediaType = file.type.startsWith('video/') ? 'video' : 'image';
            return {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                file,
                localUrl: URL.createObjectURL(file),
                isUploading: false,
                mediaType,
                filename: file.name
            };
        }
    }

    /**
     * Create audio item from blob
     */
    createAudioItem(audioBlob: Blob, filename?: string, serverUrl?: string, serverName?: string): ImageItem {
        // Convert blob to file if needed
        const file = audioBlob instanceof File ? audioBlob : new File([audioBlob], filename || 'audio.wav', { type: audioBlob.type });
        
        return {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            localUrl: URL.createObjectURL(file),
            serverUrl,
            serverName,
            isUploading: false,
            mediaType: 'audio',
            filename: filename || file.name
        };
    }

    /**
     * Remove image by index
     */
    removeImage(index: number): ImageItem[] {
        if (index >= 0 && index < this.images.length) {
            const imageToRemove = this.images[index];
            // Clean up local URL to prevent memory leaks
            URL.revokeObjectURL(imageToRemove.localUrl);
            this.images = this.images.filter((_, i) => i !== index);
        }
        return this.images;
    }

    /**
     * Get current images
     */
    getImages(): ImageItem[] {
        return this.images;
    }

    /**
     * Check if any images are currently uploading
     */
    isUploading(): boolean {
        return this.images.some(img => img.isUploading) || (this.uploadMutation?.isLoading || false);
    }

    /**
     * Reorder images array
     */
    reorderImages(newImages: ImageItem[]): void {
        this.images = [...newImages];
    }

    /**
     * Clear all images and cleanup URLs
     */
    clear(): void {
        this.images.forEach(img => URL.revokeObjectURL(img.localUrl));
        this.images = [];
    }

    /**
     * Upload files with progress tracking using React Query if available
     */
    private async uploadFiles(files: File[], startIndex: number): Promise<void> {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const imageIndex = startIndex + i;
            const imageItem = this.images[imageIndex];
            
            this.options.onProgress?.(imageIndex, 'uploading');
            
            try {
                let uploadResponse;
                
                // Use React Query mutation if available
                if (this.uploadMutation) {
                    uploadResponse = await new Promise((resolve, reject) => {
                        // Create upload request with dimensions
                        const uploadRequest = {
                            files: [file],
                            width: imageItem?.width,
                            height: imageItem?.height
                        };
                        
                        this.uploadMutation.mutate(uploadRequest, {
                            onSuccess: (data: any) => {
                                resolve(data);
                            },
                            onError: (error: any) => reject(error)
                        });
                    });
                } else {
                    // Fallback to direct upload function with dimensions
                    uploadResponse = await this.options.uploadFunction({ 
                        files: [file],
                        width: imageItem?.width,
                        height: imageItem?.height
                    });
                }
                
                // Handle different response structures
                let serverUrl = '';
                let serverName = '';
                
                // Handle the API response structure: { data: [{ linkImage: "...", name: "..." }] }
                if (uploadResponse?.data && Array.isArray(uploadResponse.data)) {
                    serverUrl = uploadResponse.data[0]?.linkImage || '';
                    serverName = uploadResponse.data[0]?.name || '';
                } else if (Array.isArray(uploadResponse)) {
                    // Fallback for direct array response
                    serverUrl = uploadResponse[0]?.linkImage || uploadResponse[0]?.url || '';
                    serverName = uploadResponse[0]?.name || '';
                } else if (uploadResponse?.linkImage) {
                    serverUrl = uploadResponse.linkImage;
                    serverName = uploadResponse.name || '';
                } else if (uploadResponse?.url) {
                    serverUrl = uploadResponse.url;
                    serverName = uploadResponse.name || '';
                }

                // Update image with server URL and name
                this.images[imageIndex] = {
                    ...this.images[imageIndex],
                    serverUrl,
                    serverName,
                    isUploading: false
                };

                this.options.onProgress?.(imageIndex, 'success');
                
            } catch (error) {
                this.images[imageIndex] = {
                    ...this.images[imageIndex],
                    isUploading: false,
                    uploadError: 'Upload failed'
                };

                this.options.onProgress?.(imageIndex, 'error');
            }
        }

        this.options.onComplete?.(this.images);
    }
}

/**
 * Extract image dimensions from file
 */
export const getImageDimensions = (file: File): Promise<{width: number, height: number}> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };
        
        img.src = url;
    });
};

/**
 * Extract video dimensions from file
 */
export const getVideoDimensions = (file: File): Promise<{width: number, height: number}> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const url = URL.createObjectURL(file);
        
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(url);
            resolve({ width: video.videoWidth, height: video.videoHeight });
        };
        
        video.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load video'));
        };
        
        video.src = url;
    });
};

/**
 * Utility function to capture image from camera
 */
export const captureFromCamera = (): Promise<File | null> => {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Use back camera by default
        
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            resolve(file || null);
        };
        
        input.oncancel = () => resolve(null);
        
        input.click();
    });
};

/**
 * Utility function to select images and videos from gallery
 */
export const selectFromGallery = (multiple: boolean = true): Promise<File[]> => {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*';
        input.multiple = multiple;
        
        input.onchange = (e) => {
            const files = Array.from((e.target as HTMLInputElement).files || []);
            resolve(files);
        };
        
        input.oncancel = () => resolve([]);
        
        input.click();
    });
};
