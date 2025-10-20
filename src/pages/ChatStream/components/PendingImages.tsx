import React, { useState, useEffect } from "react";
import RemoveIcon from "@/icons/logo/chat/x.svg?react";
import "../ChatStream.module.css";

interface PendingImagesProps {
    pendingImages: string[];
    imageLoading: boolean;
    removePendingImage: (idx: number) => void;
    imageLoadingMany: boolean;
}

const PendingImages: React.FC<PendingImagesProps> = ({
    pendingImages,
    imageLoading,
    removePendingImage,
    imageLoadingMany,

}) => {
    const [loadedUrls, setLoadedUrls] = useState<string[]>([]);
    useEffect(() => {
        // Keep only loaded flags that still exist in the list
        setLoadedUrls(prev => prev.filter(url => pendingImages.includes(url)));
    }, [pendingImages]);
    if (pendingImages.length === 0) return null;
    return (
        <div className="mb-2 flex gap-2">

            {pendingImages.map((img, idx) => {
                const isLoaded = loadedUrls.includes(img);
                return (
                    <div key={img} className="relative w-[50px]">
                        <button
                            className="absolute top-1 right-1 bg-black rounded-full w-[14px] h-[14px] flex items-center justify-center z-20"
                            onClick={() => removePendingImage(idx)}
                        >
                            <RemoveIcon />
                        </button>
                        {((!isLoaded) || (imageLoading && idx === pendingImages.length - 1) || (imageLoadingMany && idx === pendingImages.length - 1)) && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl z-10">
                                <span className="loader border-2 border-white border-t-transparent rounded-full w-6 h-6 animate-spin"></span>
                            </div>
                        )}
                        <img
                            src={img}
                            alt={`pending-${idx}`}
                            className="w-full aspect-square object-cover rounded-xl transition-opacity duration-300"
                            style={{ opacity: isLoaded ? 1 : 0 }}
                            onLoad={() =>
                                setLoadedUrls((prev) =>
                                    prev.includes(img) ? prev : [...prev, img]
                                )
                            }
                            onError={() =>
                                setLoadedUrls((prev) =>
                                    prev.includes(img) ? prev : [...prev, img]
                                )
                            }
                        />
                    </div>
                );
            })}
        </div>
    );
};
export default PendingImages;
