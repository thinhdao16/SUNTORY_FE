import { useCallback } from 'react';
import { PendingFile } from '../components/PendingFilesList';

interface UsePendingFilesHandlersProps {
    chatPendingFiles: PendingFile[];
    addPendingFile: (file: Omit<PendingFile, 'id'>) => string;
    updatePendingFile: (id: string, updates: Partial<PendingFile>) => void;
    removePendingFile: (id: string) => void;
    clearPendingFiles: () => void;
    uploadImageMutation: any;
    originalHandleSendMessage: (e: any, field: string, force?: boolean) => Promise<void>;
    clearTypingAfterSend: () => Promise<void>;
    showToast: (message: string, duration?: number, type?: "success" | "error" | "warning") => void;
}

export const usePendingFilesHandlers = ({
    chatPendingFiles,
    addPendingFile,
    updatePendingFile,
    removePendingFile,
    clearPendingFiles,
    uploadImageMutation,
    originalHandleSendMessage,
    clearTypingAfterSend,
    showToast
}: UsePendingFilesHandlersProps) => {

    // Enhanced send message with pending files support
    const handleSendMessage = useCallback(async (e: any, field: string, force?: boolean) => {
        await clearTypingAfterSend();
        
        if (chatPendingFiles.length > 0) {
            const uploadingFiles = chatPendingFiles.filter((f: PendingFile) => f.isUploading);
            if (uploadingFiles.length > 0) {
                showToast(
                    `Đang upload ${uploadingFiles.length} file, vui lòng đợi...`,
                    3000,
                    "warning"
                );
                return;
            }
            const uploadedFiles = chatPendingFiles.filter((f: PendingFile) => !f.isUploading && !f.error && f.serverUrl);
            if (uploadedFiles.length > 0) {
                const fileUrls = uploadedFiles.map((f: PendingFile) => f.serverUrl!);
                const fileNames = uploadedFiles.map((f: PendingFile) => f.serverName || f.name);
                
                console.log('Sending files:', { fileUrls, fileNames });
                await originalHandleSendMessage(e, field, force);
                clearPendingFiles();
                return;
            }
        }
        
        return originalHandleSendMessage(e, field, force);
    }, [originalHandleSendMessage, clearTypingAfterSend, chatPendingFiles, clearPendingFiles, showToast]);

    // Gallery handler
    const handleOpenGallery = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*';
        input.multiple = true;
        input.onchange = async (e) => {
            const files = Array.from((e.target as HTMLInputElement).files ?? []);
            if (files.length === 0) return;
            const validFiles = files.filter(file => 
                file.type.startsWith('image/') || file.type.startsWith('video/')
            );
            const invalidFiles = files.filter(file => 
                !file.type.startsWith('image/') && !file.type.startsWith('video/')
            );
            
            if (invalidFiles.length > 0) {
                showToast(
                    `${invalidFiles.length} file không được hỗ trợ: ${invalidFiles.map(f => f.name).join(", ")}`,
                    4000,
                    "warning"
                );
            }
            
            if (validFiles.length > 0) {
                const pendingItems = validFiles.map(file => {
                    const localUrl = URL.createObjectURL(file);
                    const id = addPendingFile({
                        name: file.name,
                        type: file.type.startsWith('image/') ? 'image' : 'video',
                        url: localUrl,
                        file,
                        isUploading: true,
                        progress: 0
                    });
                    return { id, file, localUrl };
                });
                
                pendingItems.forEach(async ({ id, file, localUrl }) => {
                    try {
                        for (let i = 10; i <= 90; i += 20) {
                            updatePendingFile(id, { progress: i });
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }
                        
                        const uploaded = await uploadImageMutation.mutateAsync(file);
                        if (uploaded?.length > 0) {
                            updatePendingFile(id, {
                                url: uploaded[0].linkImage,
                                serverUrl: uploaded[0].linkImage,
                                serverName: uploaded[0].name, 
                                isUploading: false,
                                progress: 100
                            });
                            
                            URL.revokeObjectURL(localUrl);
                        }
                    } catch (error) {
                        updatePendingFile(id, {
                            isUploading: false,
                            error: 'Upload thất bại'
                        });
                    }
                });
            }
        };
        input.click();
    }, [addPendingFile, updatePendingFile, uploadImageMutation, showToast]);

    // Retry upload handler
    const handleRetryUpload = useCallback(async (id: string) => {
        const file = chatPendingFiles.find((f: PendingFile) => f.id === id);
        if (!file || !file.file) return;
        
        updatePendingFile(id, {
            isUploading: true,
            error: undefined,
            progress: 0
        });
        
        try {
            const uploaded = await uploadImageMutation.mutateAsync(file.file);
            if (uploaded?.length > 0) {
                updatePendingFile(id, {
                    url: uploaded[0].linkImage,
                    serverUrl: uploaded[0].linkImage,
                    serverName: uploaded[0].name, 
                    isUploading: false,
                    progress: 100
                });
            }
        } catch (error) {
            updatePendingFile(id, {
                isUploading: false,
                error: 'Upload thất bại'
            });
        }
    }, [chatPendingFiles, updatePendingFile, uploadImageMutation]);

    // Camera result handler
    const handleCameraResult = useCallback(async (mediaFile: File) => {
        if (!mediaFile) return;
        
        const localUrl = URL.createObjectURL(mediaFile);
        
        const fileType = mediaFile.type.startsWith('image/') ? 'image' : 
                        mediaFile.type.startsWith('video/') ? 'video' : 'file';
        
        const id = addPendingFile({
            name: mediaFile.name,
            type: fileType,
            url: localUrl,
            file: mediaFile,
            isUploading: true,
            progress: 0
        });

        try {
            for (let i = 10; i <= 90; i += 20) {
                updatePendingFile(id, { progress: i });
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            const uploaded = await uploadImageMutation.mutateAsync(mediaFile);
            if (uploaded?.length > 0) {
                updatePendingFile(id, {
                    url: uploaded[0].linkImage,
                    serverUrl: uploaded[0].linkImage,
                    serverName: uploaded[0].name,
                    isUploading: false,
                    progress: 100
                });
                
                URL.revokeObjectURL(localUrl);
            }
        } catch (error) {
            updatePendingFile(id, {
                isUploading: false,
                error: 'Upload thất bại'
            });
        }
    }, [addPendingFile, updatePendingFile, uploadImageMutation]);

    return {
        handleSendMessage,
        handleOpenGallery,
        handleRetryUpload,
        handleCameraResult
    };
};
