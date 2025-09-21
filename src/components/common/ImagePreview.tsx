import React from 'react';
import { useTranslation } from 'react-i18next';
import { ImageItem } from '@/utils/imageUpload';

interface ImagePreviewProps {
    images: ImageItem[];
    onRemoveImage: (index: number) => void;
    className?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
    images,
    onRemoveImage,
    className = ""
}) => {
    const { t } = useTranslation();

    if (images.length === 0) return null;

    const renderOverlay = (imageItem: ImageItem) => {
        if (imageItem.uploadError) {
            return (
                <div className="absolute inset-0 bg-red-500/20 rounded-2xl flex items-center justify-center z-10">
                    <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                        {t("Upload failed")}
                    </div>
                </div>
            );
        }
        
        if (imageItem.isUploading) {
            return (
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-white text-sm font-medium">
                            {t("Uploading...")}
                        </span>
                    </div>
                </div>
            );
        }
        
        return null;
    };

    return (
        <div className={`overflow-x-auto ${className}`}>
            <div className="flex gap-3 pb-2" style={{ width: `${images.length * 120 + (images.length - 1) * 12}px` }}>
                {images.map((imageItem: ImageItem, index: number) => (
                    <div key={index} className="relative flex-shrink-0">
                        <div className="w-28 h-28 rounded-lg overflow-hidden bg-gray-100">
                            <img
                                src={imageItem.serverUrl || imageItem.localUrl}
                                alt={`Upload ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            {renderOverlay(imageItem)}
                        </div>
                        <button
                            onClick={() => onRemoveImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm shadow-lg hover:bg-red-600 transition-colors z-20"
                            disabled={imageItem.isUploading}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
