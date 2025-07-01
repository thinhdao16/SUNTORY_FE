import React from "react";
import RemoveIcon from "@/icons/logo/chat/x.svg?react";
import "../Chat.module.css"

interface PendingImagesProps {
    pendingImages: string[];
    imageLoading: boolean;
    removePendingImage: (idx: number) => void;
}

const PendingImages: React.FC<PendingImagesProps> = ({
    pendingImages,
    imageLoading,
    removePendingImage,
}) => {
    if (pendingImages.length === 0) return null;
    return (
        <div className="mb-2 flex gap-2 ">
            {pendingImages.map((img, idx) => (
                <div key={idx} className="relative w-[50px]">
                    <button
                        className="absolute top-1 right-1 bg-black rounded-full w-[14px] h-[14px] justify-center items-center flex"
                        onClick={() => removePendingImage(idx)}
                        style={{ lineHeight: 0 }}
                    >
                        <RemoveIcon className="" />
                    </button>
                    <img
                        src={img || undefined}
                        alt={`captured-${idx}`}
                        className="w-full aspect-square object-cover rounded-xl"
                    />
                    {imageLoading && idx === pendingImages.length - 1 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl z-10">
                            <span className="loader border-2 border-white border-t-transparent rounded-full w-6 h-6 animate-spin"></span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default PendingImages;