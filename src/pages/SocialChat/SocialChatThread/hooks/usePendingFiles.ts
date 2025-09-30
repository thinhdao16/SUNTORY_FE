import { useState, useCallback } from 'react';
import { PendingFile } from '../components/PendingFilesList';

export const usePendingFiles = () => {
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

    const addPendingFile = useCallback((file: Omit<PendingFile, 'id'>) => {
        const newFile: PendingFile = {
            ...file,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        };
        setPendingFiles(prev => [...prev, newFile]);
        return newFile.id;
    }, []);

    const addPendingFiles = useCallback((files: Omit<PendingFile, 'id'>[]) => {
        const newFiles: PendingFile[] = files.map(file => ({
            ...file,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        }));
        setPendingFiles(prev => [...prev, ...newFiles]);
        return newFiles.map(f => f.id);
    }, []);

    const updatePendingFile = useCallback((id: string, updates: Partial<PendingFile>) => {
        setPendingFiles(prev => prev.map(file => 
            file.id === id ? { ...file, ...updates } : file
        ));
    }, []);

    const removePendingFile = useCallback((id: string) => {
        setPendingFiles(prev => prev.filter(file => file.id !== id));
    }, []);

    const clearPendingFiles = useCallback(() => {
        setPendingFiles([]);
    }, []);

    const getPendingFile = useCallback((id: string) => {
        return pendingFiles.find(file => file.id === id);
    }, [pendingFiles]);

    return {
        pendingFiles,
        addPendingFile,
        addPendingFiles,
        updatePendingFile,
        removePendingFile,
        clearPendingFiles,
        getPendingFile,
    };
};
