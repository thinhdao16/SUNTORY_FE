import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import CloseIcon from "@/icons/logo/close-default.svg?react";
import CheckboxIcon from "@/icons/logo/checkbox-select-default.svg?react";
import PlayAudioIcon from "@/icons/logo/play-audio.svg?react";
import MicIcon from "@/icons/logo/chat/mic.svg?react"

interface AudioRecorderProps {
    onAudioRecorded: (audioBlob: Blob, duration: number, serverUrl?: string, filename?: string) => void;
    onRemoveAudio: () => void;
    onRecordingStateChange?: (isRecording: boolean) => void;
    audioBlob?: Blob;
    isRecording?: boolean;
    duration?: number;
    className?: string;
    serverUrl?: string;
    isUploading?: boolean;
    showAsButton?: boolean;
    audioUploadMutation?: any;
};

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
    onAudioRecorded,
    onRemoveAudio,
    onRecordingStateChange,
    audioBlob,
    isRecording = false,
    duration = 0,
    className = '',
    serverUrl = '',
    isUploading = false,
    showAsButton = false,
    audioUploadMutation
}) => {
    const { t } = useTranslation();
    const [localIsRecording, setLocalIsRecording] = useState(false);
    const [localDuration, setLocalDuration] = useState(0);
    const [recordedDuration, setRecordedDuration] = useState(duration);
    const [isPlaying, setIsPlaying] = useState(false);
    const [waveformBars, setWaveformBars] = useState<number[]>([]);
    const [audioProgress, setAudioProgress] = useState(0);
    const intervalRef = useRef<number | null>(null);
    const progressIntervalRef = useRef<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (duration > 0) {
            setRecordedDuration(duration);
        }
    }, [duration]);


    const generateWaveformBars = () => {
        const bars = [];
        const barCount = 40;

        for (let i = 0; i < barCount; i++) {
            bars.push(Math.random() * 0.8 + 0.2);
        }

        setWaveformBars(bars);
    };

    const startRecording = async () => {
        try {
            if (audioBlob) {
                onRemoveAudio();
            }

            const hasPermission = await VoiceRecorder.hasAudioRecordingPermission();
            if (hasPermission.value === false) {
                const permission = await VoiceRecorder.requestAudioRecordingPermission();
                if (permission.value === false) {
                    console.error('Audio recording permission denied');
                    return;
                }
            }

            await VoiceRecorder.startRecording();
            setLocalIsRecording(true);
            setLocalDuration(0);
            setWaveformBars([]);
            setRecordedDuration(0);
            setAudioProgress(0);
            onRecordingStateChange?.(true);

            intervalRef.current = setInterval(() => {
                setLocalDuration(prev => prev + 1);
                generateWaveformBars();
            }, 100);

        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    };
    const stopRecording = async () => {
        if (localIsRecording) {
            try {
                const result = await VoiceRecorder.stopRecording();
                setLocalIsRecording(false);
                onRecordingStateChange?.(false);
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                if (result.value && result.value.recordDataBase64) {
                    const base64Data = result.value.recordDataBase64;
                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const audioBlob = new Blob([byteArray], { type: 'audio/aac' });
                    const finalDuration = result.value.msDuration ? Math.floor(result.value.msDuration / 1000) : localDuration;
                    setRecordedDuration(finalDuration);
                    const audioFile = new File([audioBlob], `audio_${Date.now()}.aac`, {
                        type: 'audio/aac'
                    });
                    if (audioUploadMutation) {
                        audioUploadMutation.mutate({ files: [audioFile] }, {
                            onSuccess: (response: any) => {
                                console.log('Audio upload success:', response);
                                const serverUrl = response.url || '';
                                const filename = response.filename || '';
                                onAudioRecorded(audioBlob, finalDuration, serverUrl, filename);
                            },
                            onError: (error: any) => {
                                console.error('Audio upload failed:', error);
                                onAudioRecorded(audioBlob, finalDuration);
                            }
                        });
                    } else {
                        console.warn('Audio upload mutation not available');
                        onAudioRecorded(audioBlob, finalDuration);
                    }
                }
            } catch (error) {
                console.error('Failed to stop recording:', error);
                setLocalIsRecording(false);
                onRecordingStateChange?.(false);
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            }
        }
    };

    const cancelRecording = async () => {
        if (localIsRecording) {
            try {
                await VoiceRecorder.stopRecording();
                setLocalIsRecording(false);
                setLocalDuration(0);
                onRecordingStateChange?.(false);

                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            } catch (error) {
                console.error('Failed to cancel recording:', error);
                setLocalIsRecording(false);
                setLocalDuration(0);
                onRecordingStateChange?.(false);
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            }
        }
    };

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, []);
    const [barWidth, setBarWidth] = useState(2);

    useEffect(() => {
        const updateBarWidth = () => {
            const screenWidth = window.innerWidth;
            const maxWidth = Math.min(screenWidth, 450);
            setBarWidth(maxWidth / 6.5);
        };

        updateBarWidth();
        window.addEventListener("resize", updateBarWidth);
        return () => window.removeEventListener("resize", updateBarWidth);
    }, []);
    const playAudio = async () => {
        if ((audioBlob || serverUrl) && !isPlaying) {
            try {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                }

                let audioUrl;
                if (audioBlob) {
                    audioUrl = URL.createObjectURL(audioBlob);
                } else {
                    audioUrl = serverUrl;
                }

                const audio = new Audio();
                audio.src = audioUrl;
                audioRef.current = audio;

                audio.onloadedmetadata = () => {
                    console.log('Audio loaded, duration:', audio.duration);
                };

                audio.onended = () => {
                    setIsPlaying(false);
                    setAudioProgress(0);
                    if (audioBlob) {
                        URL.revokeObjectURL(audioUrl);
                    }
                    audioRef.current = null;
                    if (progressIntervalRef.current) {
                        clearInterval(progressIntervalRef.current);
                        progressIntervalRef.current = null;
                    }
                };

                audio.onerror = (e) => {
                    console.error('Audio playback error:', e);
                    setIsPlaying(false);
                    if (audioBlob) {
                        URL.revokeObjectURL(audioUrl);
                    }
                    audioRef.current = null;
                };

                setIsPlaying(true);
                progressIntervalRef.current = setInterval(() => {
                    if (audioRef.current) {
                        const currentTime = audioRef.current.currentTime;
                        const totalDuration = recordedDuration || duration || audioRef.current.duration || 1;
                        setAudioProgress((currentTime / totalDuration) * 60);
                    }
                }, 100);

                await audio.play();
            } catch (error) {
                console.error('Failed to play audio:', error);
                setIsPlaying(false);
            }
        }
    };


    if (showAsButton && !audioBlob && !localIsRecording) {
        return (
            <button
                onClick={startRecording}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
                title={t("Record Audio")}
            >
                <MicIcon />
            </button>
        );
    }

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
            setAudioProgress(0);
        }
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    };

    const handleRemoveAudio = () => {
        stopAudio();
        setRecordedDuration(0);
        setAudioProgress(0);
        setIsPlaying(false);
        setWaveformBars([]);
        onRemoveAudio();
    };
    if (showAsButton && !audioBlob && !localIsRecording) {
        return (
            <button
                onClick={startRecording}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
                title={t("Record Audio")}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            </button>
        );
    }

    if ((audioBlob || serverUrl) && !localIsRecording && !showAsButton) {
        return (
            <div className={`flex items-center justify-between gap-3 p-4 border border-netural-50 rounded-2xl relative ${className}`}>
                {(isUploading || audioUploadMutation?.isLoading) && (
                    <div className="absolute inset-0 bg-gray-100/80 rounded-xl flex items-center justify-center z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-gray-700">{t("Uploading...")}</span>
                        </div>
                    </div>
                )}
                <button
                    onClick={isPlaying ? stopAudio : playAudio}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                    disabled={isUploading || audioUploadMutation?.isLoading}
                >
                    {isPlaying ? (
                        <svg className="w-6 h-6 text-netural-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                    ) : (
                        <PlayAudioIcon className="w-6 h-6 ml-0.5" />
                    )}
                </button>
                <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 h-4">
                            {Array.from({ length: barWidth }).map((_, i) => {
                                const isActive = i < audioProgress;
                                return (
                                    <div
                                        key={i}
                                        className="w-[1px] rounded-full transition-all duration-150"
                                        style={{
                                            height: `${Math.random() * 60 + 60}%`,
                                            backgroundColor: isActive ? 'black' : 'lightgray',
                                            opacity: isActive ? 0.8 : 0.3
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleRemoveAudio}
                    className="w-7 h-7 aspect-square bg-netural-100 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-white"
                    disabled={isUploading || audioUploadMutation?.isLoading}
                >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                </button>
            </div>
        );
    }

    if (localIsRecording) {
        return (
            <div className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg ${className}`}>

                <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-1 h-4 mt-1">
                        {Array.from({ length: barWidth }).map((_, i) => {
                            const progressPercentage = (localDuration / 100) * 60;
                            const isActive = i < progressPercentage;
                            return (
                                <div
                                    key={i}
                                    className="w-[1px] rounded-full transition-all duration-150"
                                    style={{
                                        height: `${Math.random() * 60 + 60}%`,
                                        backgroundColor: isActive ? 'black' : 'lightgray',
                                        opacity: isActive ? 0.8 : 0.3
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={cancelRecording}
                    >
                        <CloseIcon />
                    </button>
                    <button
                        onClick={stopRecording}
                    >
                        <CheckboxIcon />
                    </button>
                </div>
            </div>
        );
    }
    return (
        <button
            onClick={startRecording}
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
            title={t("Record Audio")}
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
        </button>
    );
}