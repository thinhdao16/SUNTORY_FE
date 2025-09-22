import React, { useState, useCallback } from 'react';
import { IoPlay } from 'react-icons/io5';

interface VideoWithPlaceholderProps {
    src: string;
    width: number;
    height: number;
    className?: string;
    onClick?: () => void;
    maxHeight?: string;
    objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
    controls?: boolean;
    muted?: boolean;
    autoPlay?: boolean;
}

export const VideoWithPlaceholder: React.FC<VideoWithPlaceholderProps> = ({
    src,
    width,
    height,
    className = '',
    onClick,
    maxHeight = '60vh',
    objectFit = 'cover',
    controls = true,
    muted = true,
    autoPlay = false
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Calculate aspect ratio
    const aspectRatio = width / height;
    
    const handleLoadedData = useCallback(() => {
        setIsLoaded(true);
        setHasError(false);
    }, []);

    const handleError = useCallback(() => {
        setHasError(true);
        setIsLoaded(true);
    }, []);

    return (
        <div 
            className={`relative overflow-hidden ${className}`}
            style={{ 
                aspectRatio: aspectRatio.toString(),
                maxHeight 
            }}
            onClick={onClick}
        >
            {/* Placeholder with shimmer effect */}
            <div 
                className={`absolute inset-0 bg-gray-200 transition-opacity duration-500 ${
                    isLoaded ? 'opacity-0' : 'opacity-100'
                }`}
            >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"></div>
                
                {/* Loading spinner with play icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-black bg-opacity-20 rounded-full flex items-center justify-center">
                            <IoPlay className="w-6 h-6 text-white ml-1" />
                        </div>
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>

            {/* Actual video */}
            <video
                src={src}
                className={`w-full h-full transition-all duration-300 ${
                    isLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
                } ${hasError ? 'hidden' : ''}`}
                style={{ 
                    objectFit,
                    aspectRatio: aspectRatio.toString()
                }}
                onLoadedData={handleLoadedData}
                onError={handleError}
                controls={controls}
                muted={muted}
                autoPlay={autoPlay}
                preload="metadata"
            />

            {/* Error state */}
            {hasError && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">Failed to load video</p>
                    </div>
                </div>
            )}

            {/* Hover effect overlay */}
            {onClick && (
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 cursor-pointer" />
            )}
        </div>
    );
};
