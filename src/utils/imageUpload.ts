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
    // internal: upload abort controller id/reference
    _abortId?: string;
}
 
export interface ImageUploadOptions {
    onProgress?: (imageIndex: number, progress: 'uploading' | 'success' | 'error') => void;
    onComplete?: (images: ImageItem[]) => void;
    uploadFunction: (params: { files: File[], width?: number, height?: number, signal?: AbortSignal }) => Promise<any>;
}

export function getImageDimensions(file: File): Promise<{width: number, height: number}> {
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
}

export function getVideoDimensions(file: File): Promise<{width: number, height: number}> {
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
}

export class ImageUploadManager {
    private images: ImageItem[] = [];
    private options: ImageUploadOptions;
    private uploadMutation?: any;
    // Track controllers by unique id
    private controllers: Map<string, AbortController> = new Map();
    // Track files that have been canceled even if their ImageItem isn't created yet
    private canceledFiles: WeakSet<File> = new WeakSet();

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
            // Skip files that were canceled before their turn
            if (this.canceledFiles.has(file)) {
                continue;
            }
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
                
                const abortId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                newImages.push({
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    file,
                    localUrl: URL.createObjectURL(file),
                    isUploading: true,
                    width: dimensions.width,
                    height: dimensions.height,
                    mediaType,
                    _abortId: abortId
                });
            } catch (error) {
                // Fallback without dimensions
                const mediaType: MediaType = file.type.startsWith('video/') ? 'video' : 'image';
                const abortId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                newImages.push({
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    file,
                    localUrl: URL.createObjectURL(file),
                    isUploading: true,
                    mediaType,
                    _abortId: abortId
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
            // Mark file as canceled to avoid later re-add when addFiles finishes
            if (imageToRemove?.file) {
                this.canceledFiles.add(imageToRemove.file);
            }
            // Cancel in-flight upload if any
            if (imageToRemove?._abortId) {
                const ctrl = this.controllers.get(imageToRemove._abortId);
                if (ctrl) {
                    ctrl.abort();
                    this.controllers.delete(imageToRemove._abortId);
                }
            }
            // Clean up local URL to prevent memory leaks
            URL.revokeObjectURL(imageToRemove.localUrl);
            this.images = this.images.filter((_, i) => i !== index);
        }
        return this.images;
    }

    /**
     * Mark a file as canceled even if its ImageItem hasn't been added yet.
     * Also abort any existing controller associated with this file.
     */
    cancelFile(file: File): void {
        try {
            this.canceledFiles.add(file);
            // If an item already exists for this file, abort and remove it
            const idx = this.images.findIndex(it => it.file === file);
            if (idx >= 0) {
                const it = this.images[idx];
                if (it?._abortId) {
                    const ctrl = this.controllers.get(it._abortId);
                    if (ctrl) {
                        ctrl.abort();
                        this.controllers.delete(it._abortId);
                    }
                }
                try { URL.revokeObjectURL(it.localUrl); } catch {}
                this.images.splice(idx, 1);
            }
        } catch {}
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
        // Abort all ongoing uploads
        try {
            this.controllers.forEach((ctrl) => {
                try { ctrl.abort(); } catch {}
            });
        } finally {
            this.controllers.clear();
        }
        this.images.forEach(img => URL.revokeObjectURL(img.localUrl));
        this.images = [];
    }

    /**
     * Upload files with progress tracking using React Query if available
     */
    private async uploadFiles(files: File[], startIndex: number): Promise<void> {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // Skip canceled files
            if (this.canceledFiles.has(file)) {
                const idx = this.images.findIndex(it => it.file === file);
                if (idx !== -1) {
                    this.images[idx] = {
                        ...this.images[idx],
                        isUploading: false,
                        uploadError: 'Canceled'
                    };
                    this.options.onProgress?.(idx, 'error');
                }
                continue;
            }
            // Item may have been removed before its turn; find current index by file
            let imageIndex = this.images.findIndex(it => it.file === file);
            if (imageIndex === -1) {
                // Skip uploading this file entirely
                continue;
            }
            const imageItem = this.images[imageIndex];

            this.options.onProgress?.(imageIndex, 'uploading');

            // Ensure we have a stable abortId for this item
            let abortId = imageItem?._abortId || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            if (imageItem && !imageItem._abortId) {
                this.images[imageIndex]._abortId = abortId;
            }

            try {
                let uploadResponse;

                // Use React Query mutation if available
                if (this.uploadMutation) {
                    uploadResponse = await new Promise((resolve, reject) => {
                        // Create upload request with dimensions
                        const uploadRequest = {
                            files: [file],
                            width: imageItem?.width,
                            height: imageItem?.height,
                            signal: undefined as AbortSignal | undefined,
                        };
                        // Create controller and attach by abortId
                        const controller = new AbortController();
                        this.controllers.set(abortId, controller);
                        uploadRequest.signal = controller.signal;

                        this.uploadMutation.mutate(uploadRequest, {
                            onSuccess: (data: any) => {
                                if (controller.signal.aborted) {
                                    this.controllers.delete(abortId);
                                    return reject(new DOMException('Aborted', 'AbortError'));
                                }
                                this.controllers.delete(abortId);
                                resolve(data);
                            },
                            onError: (error: any) => { this.controllers.delete(abortId); reject(error); }
                        });
                    });
                } else {
                    // Fallback to direct upload function with dimensions
                    const controller = new AbortController();
                    this.controllers.set(abortId, controller);
                    uploadResponse = await this.options.uploadFunction({ 
                        files: [file],
                        width: imageItem?.width,
                        height: imageItem?.height,
                        signal: controller.signal,
                    });
                    if (controller.signal.aborted) {
                        this.controllers.delete(abortId);
                        throw new DOMException('Aborted', 'AbortError');
                    }
                    this.controllers.delete(abortId);
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

                // Update image with server URL and name by locating current index via this upload's abortId (handles reorder/removal)
                {
                    const currentIndex = this.images.findIndex(it => it._abortId === abortId || it.file === file);
                    if (currentIndex !== -1) {
                        this.images[currentIndex] = {
                            ...this.images[currentIndex],
                            serverUrl,
                            serverName,
                            isUploading: false
                        };
                        this.options.onProgress?.(currentIndex, 'success');
                    }
                }
            } catch (error) {
                // If aborted (DOM AbortError or Axios ERR_CANCELED), just skip updating/adding
                const err: any = error;
                if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED' || String(err?.message || '').toLowerCase().includes('canceled')) {
                    const currentIndex = this.images.findIndex(it => it._abortId === abortId || it.file === file);
                    if (currentIndex !== -1) {
                        this.images[currentIndex] = {
                            ...this.images[currentIndex],
                            isUploading: false,
                            uploadError: 'Canceled'
                        };
                        this.options.onProgress?.(currentIndex, 'error');
                    }
                    continue;
                }
                {
                    const currentIndex = this.images.findIndex(it => it._abortId === abortId || it.file === file);
                    if (currentIndex !== -1) {
                        this.images[currentIndex] = {
                            ...this.images[currentIndex],
                            isUploading: false,
                            uploadError: 'Upload failed'
                        };
                        this.options.onProgress?.(currentIndex, 'error');
                    }
                }
            }
        }

        this.options.onComplete?.(this.images);
       // Do not clear globally here to avoid interfering with concurrent uploads; controllers are deleted per-upload
    }
}
/**
 * Utility function to capture image from camera
 */
export const captureFromCamera = (): Promise<File | null> => {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Use back camera by default
        
        input.onchange = (e: Event) => {
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
        
        input.onchange = (e: Event) => {
            const files = Array.from((e.target as HTMLInputElement).files || []);
            resolve(files);
        };
        
        input.oncancel = () => resolve([]);
        
        input.click();
    });
};
