import React, { useState, useCallback } from 'react';

interface ImageWithPlaceholderProps {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
    onClick?: () => void;
    maxHeight?: string;
    objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
}

export const ImageWithPlaceholder: React.FC<ImageWithPlaceholderProps> = ({
    src,
    alt,
    width,
    height,
    className = '',
    onClick,
    maxHeight = '60vh',
    objectFit = 'cover'
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const aspectRatio = width / height;
    
    const handleLoad = useCallback(() => {
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
            <div 
                className={`absolute inset-0 bg-gray-200 transition-opacity duration-500 ${
                    isLoaded ? 'opacity-0' : 'opacity-100'
                }`}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"></div>
                
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
            </div>

            <img
                src={src}
                alt={alt}
                className={`w-full h-full transition-all duration-300 ${
                    isLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
                } ${hasError ? 'hidden' : ''}`}
                style={{ 
                    objectFit,
                    aspectRatio: aspectRatio.toString()
                }}
                onLoad={handleLoad}
                onError={handleError}
                loading="lazy"
            />

            {hasError && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">Failed to load</p>
                    </div>
                </div>
            )}
        </div>
    );
};
