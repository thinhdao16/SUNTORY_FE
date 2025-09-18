import React, { useMemo, useState } from "react";
import { IoClose } from "react-icons/io5";

export interface ImageItem {
    serverUrl?: string;
    localUrl?: string;
    width?: number;
    height?: number;
    isUploading?: boolean;
    uploadError?: boolean | string;
    mediaType?: 'image' | 'video' | 'audio';
}

interface FlexImageGridProps {
    images: ImageItem[];
    onRemoveImage?: (index: number) => void;
    className?: string;

    targetHeight?: number;
    minItemWidth?: number;
    gap?: number;
    fit?: "contain" | "cover";
    snap?: boolean;
    showRemoveButton?: boolean;
}

export const FlexImageGrid: React.FC<FlexImageGridProps> = ({
    images,
    onRemoveImage,
    className = "",
    targetHeight = 260,
    minItemWidth = 120,
    gap = 8,
    fit = "contain",
    snap = true,
    showRemoveButton = true,
}) => {
    if (!images || images.length === 0) return null;

    const wrapperStyle: React.CSSProperties = useMemo(
        () => ({
            columnGap: `${gap}px`,
            WebkitOverflowScrolling: "touch",
        }),
        [gap]
    );

    return (
        <div className={`w-full ${className}`}>
            <div
                className={`flex overflow-x-auto pb-2 ${snap ? "snap-x snap-mandatory" : ""
                    }`}
                style={wrapperStyle}
            >
                {images.map((img, idx) => {
                    const iw = img.width && img.width > 0 ? img.width : 1;
                    const ih = img.height && img.height > 0 ? img.height : 1;
                    const ratio = iw / ih;

                    let itemWidth: number;
                    let itemHeight: number;

                    if (images.length === 1) {
                        const fixedWidth = 300;
                        itemWidth = fixedWidth;
                        itemHeight = Math.round(fixedWidth / ratio);
                    } else {
                        const computedW = Math.round(targetHeight * ratio);
                        itemWidth = Math.max(minItemWidth, computedW);
                        itemHeight = targetHeight;
                    }

                    const src = img.serverUrl || img.localUrl || "";

                    return (
                        <StripItem
                            key={`${src}-${idx}`}
                            src={src}
                            width={itemWidth}
                            height={itemHeight}
                            isUploading={!!img.isUploading}
                            uploadError={!!img.uploadError}
                            fit={fit}
                            snap={snap}
                            onRemove={showRemoveButton && onRemoveImage ? () => onRemoveImage(idx) : undefined}
                        />
                    );
                })}
            </div>
        </div>
    );
};

const StripItem: React.FC<{
    src: string;
    width: number;
    height: number;
    isUploading: boolean;
    uploadError: boolean;
    fit: "contain" | "cover";
    snap: boolean;
    onRemove?: () => void;
}> = ({ src, width, height, isUploading, uploadError, fit, snap, onRemove }) => {
    const [loaded, setLoaded] = useState(false);

    return (
        <div
            className={`relative flex-none rounded-2xl overflow-hidden bg-gray-100 ${snap ? "snap-start" : ""
                }`}
            style={{ width, height }}
        >
            {!loaded && (
                <div className="absolute inset-0 animate-pulse bg-gray-200" />
            )}

            {src.includes('video') || src.includes('.mp4') || src.includes('.mov') || src.includes('.avi') ? (
                <video
                    src={src}
                    controls
                    muted
                    onLoadedData={() => setLoaded(true)}
                    onError={() => setLoaded(true)}
                    className={`absolute inset-0 h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"
                        } ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-200`}
                    style={{ objectPosition: "center" }}
                />
            ) : (
                <img
                    src={src}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    onLoad={() => setLoaded(true)}
                    onError={() => setLoaded(true)}
                    className={`absolute inset-0 h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"
                        } ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-200`}
                    style={{ objectPosition: "center" }}
                />
            )}

            {isUploading && (
                <div className="absolute inset-0 bg-black/35 flex items-center justify-center pointer-events-none">
                    <div className="flex items-center gap-2 text-white text-xs">
                        <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                        <span>Uploading…</span>
                    </div>
                </div>
            )}

            {uploadError && (
                <div className="absolute inset-0 bg-red-500/15 flex items-center justify-center">
                    <div className="bg-red-500 text-white px-2 py-1 rounded text-xs shadow">
                        Upload error
                    </div>
                </div>
            )}

            {onRemove && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                    aria-label="Remove image"
                >
                    <IoClose className="w-4 h-4 text-white" />
                </button>
            )}
        </div>
    );
};
