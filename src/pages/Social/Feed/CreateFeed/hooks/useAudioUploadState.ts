import { useState, useCallback } from 'react';
import { useAudioUpload } from '@/pages/Social/Feed/hooks/useUploadMutations';

export const useAudioUploadState = () => {
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioDuration, setAudioDuration] = useState(0);
    const [audioServerUrl, setAudioServerUrl] = useState<string>("");
    const [audioFilename, setAudioFilename] = useState<string>("");
    const [isAudioUploading, setIsAudioUploading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    
    const audioUploadMutation = useAudioUpload();

    const handleAudioRecorded = useCallback((blob: Blob, duration: number, serverUrl?: string, filename?: string) => {
        // Clear any existing audio first
        setAudioBlob(null);
        setAudioDuration(0);
        setAudioServerUrl("");
        setAudioFilename("");
        
        // Set new audio
        setAudioBlob(blob);
        setAudioDuration(duration);
        setAudioServerUrl(serverUrl || "");
        setAudioFilename(filename || "");
        setIsAudioUploading(false);
    }, []);

    const handleRemoveAudio = useCallback(() => {
        setAudioBlob(null);
        setAudioDuration(0);
        setAudioServerUrl("");
        setAudioFilename("");
        setIsAudioUploading(false);
    }, []);

    const clearAudio = useCallback(() => {
        if (audioBlob) {
            setAudioBlob(null);
            setAudioDuration(0);
            setAudioServerUrl("");
            setAudioFilename("");
        }
    }, [audioBlob]);

    return {
        audioBlob,
        setAudioBlob,
        audioDuration,
        setAudioDuration,
        audioServerUrl,
        setAudioServerUrl,
        audioFilename,
        setAudioFilename,
        isAudioUploading,
        isRecording,
        setIsRecording,
        audioUploadMutation,
        handleAudioRecorded,
        handleRemoveAudio,
        clearAudio
    };
};
