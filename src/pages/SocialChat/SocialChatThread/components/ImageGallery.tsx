// src/pages/SocialChat/SocialChatThread/components/ImageGallery.tsx
import React, { useState, useRef, useEffect } from "react";

interface ImageGalleryProps {
    chatAttachments: any[];
    isUser: boolean;
    onImageClick: (index: number, images: string[]) => void;
    isRevoked: boolean;
    actionContainerRef?: React.RefObject<HTMLDivElement | null>;
    onEdit: () => void;
    onRevoke: () => void;
    onReply: () => void;
    showActionsMobile: boolean;
}

function useOddLastImageHeight(photoAlbumPhotos: any[]): [React.RefObject<HTMLImageElement>, React.RefObject<HTMLImageElement>, number] {
    const ref1 = useRef<any>(null);
    const ref2 = useRef<any>(null);
    const [bottomHeight, setBottomHeight] = useState(180);

    useEffect(() => {
        if (photoAlbumPhotos.length % 2 === 1 && photoAlbumPhotos.length >= 3) {
            const handleLoad = () => {
                const h1 = ref1.current ? ref1.current.offsetHeight : 0;
                const h2 = ref2.current ? ref2.current.offsetHeight : 0;
                setBottomHeight(h1 + h2 > 0 ? h1 + h2 : 180);
            };
            if (ref1.current) ref1.current.onload = handleLoad;
            if (ref2.current) ref2.current.onload = handleLoad;
            setTimeout(handleLoad, 120);
        }
    }, [photoAlbumPhotos]);
    return [ref1, ref2, bottomHeight];
}

const MAX_PREVIEW = 5;

export const ImageGallery: React.FC<ImageGalleryProps> = ({
    chatAttachments,
    isUser,
    onImageClick,
    isRevoked,
    actionContainerRef,
    onEdit,
    onRevoke,
    onReply,
    showActionsMobile
}) => {
    const [showAll, setShowAll] = useState(false);

    const imageFiles = chatAttachments.filter((file: any) =>
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file.fileName || "")
    );

    const photoAlbumPhotos = imageFiles.map((file: any) => ({
        src: file.fileUrl,
        width: 800,
        height: 600,
    }));

    const displayPhotos = showAll ? photoAlbumPhotos : photoAlbumPhotos.slice(0, MAX_PREVIEW);
    const remaining = photoAlbumPhotos.length - MAX_PREVIEW;
    const [ref1, ref2, bottomHeight] = useOddLastImageHeight(photoAlbumPhotos);

    const handleImageClick = (idx: number) => {
        const allImages = photoAlbumPhotos.map((p: { src: string }) => p.src);
        onImageClick(idx, allImages);
    };

    if (imageFiles.length === 0) return null;

    return (
        <div className={`flex ${isUser ? "ml-auto" : "mr-auto"}`}>
            <div className="mb-2 space-y-2 relative">
                <div
                    className={displayPhotos.length === 1
                        ? "w-[250px] rounded-2xl overflow-hidden"
                        : "grid gap-2 w-[250px] rounded-2xl overflow-hidden grid-cols-2"
                    }
                >
                    {displayPhotos.map((photo: { src: string }, idx: number) => {
                        const isLast = !showAll && idx === MAX_PREVIEW - 1 && remaining > 0;
                        const isLastOdd = displayPhotos.length % 2 === 1 && idx === displayPhotos.length - 1;
                        const isSecondLast = displayPhotos.length % 2 === 1 && idx === displayPhotos.length - 2;
                        const isThirdLast = displayPhotos.length % 2 === 1 && idx === displayPhotos.length - 3;

                        if (isLast && isLastOdd) {
                            return (
                                <div
                                    key={idx}
                                    className="relative object-cover rounded-2xl col-span-2 w-full h-[180px] cursor-pointer overflow-hidden"
                                    style={{ gridColumn: "1 / span 2" }}
                                    onClick={() => handleImageClick(idx)}
                                >
                                    <img
                                        src={photo.src}
                                        alt=""
                                        className="w-full h-full object-cover rounded-2xl"
                                        style={{ filter: "brightness(0.7)" }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-white font-bold text-2xl bg-black/50 px-4 py-2 rounded-2xl select-none pointer-events-none">
                                            +{remaining}
                                        </span>
                                    </div>
                                </div>
                            );
                        }

                        if (isLast) {
                            return (
                                <div
                                    key={idx}
                                    className="relative object-cover rounded-2xl w-full h-full cursor-pointer overflow-hidden"
                                    onClick={() => handleImageClick(idx)}
                                >
                                    <img
                                        src={photo.src}
                                        alt=""
                                        className="w-full h-full object-cover rounded-2xl"
                                        style={{ filter: "brightness(0.7)" }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-white font-bold text-2xl bg-black/50 px-4 py-2 rounded-2xl select-none pointer-events-none">
                                            +{remaining}
                                        </span>
                                    </div>
                                </div>
                            );
                        }

                        if (isLastOdd) {
                            return (
                                <img
                                    key={idx}
                                    src={photo.src}
                                    alt=""
                                    onClick={() => handleImageClick(idx)}
                                    className="object-cover rounded-2xl col-span-2 w-full"
                                    style={{
                                        gridColumn: "1 / span 2",
                                        cursor: "pointer",
                                        height: bottomHeight || 180,
                                        objectFit: "cover",
                                    }}
                                />
                            );
                        }

                        if (isThirdLast) {
                            return (
                                <img
                                    key={idx}
                                    src={photo.src}
                                    alt=""
                                    ref={ref1}
                                    onClick={() => handleImageClick(idx)}
                                    className="object-cover rounded-2xl w-full h-full"
                                    style={{ cursor: "pointer" }}
                                />
                            );
                        }

                        if (isSecondLast) {
                            return (
                                <img
                                    key={idx}
                                    src={photo.src}
                                    alt=""
                                    ref={ref2}
                                    onClick={() => handleImageClick(idx)}
                                    className="object-cover rounded-2xl w-full h-full"
                                    style={{ cursor: "pointer" }}
                                />
                            );
                        }

                        return (
                            <img
                                key={idx}
                                src={photo.src}
                                alt=""
                                onClick={() => handleImageClick(idx)}
                                className="object-cover rounded-2xl w-full h-full"
                                style={{ cursor: "pointer" }}
                            />
                        );
                    })}
                    <>
                    
                    </>
                </div>
                {!isRevoked && (
                    <div ref={actionContainerRef}
                        className={`absolute w-full top-1/2 -translate-y-1/2 ${isUser ? "-left-24" : "-right-80"} ${showActionsMobile ? "flex" : "hidden group-hover:flex"} gap-2 p-1`}
                        style={{ pointerEvents: 'auto' }}
                    >
                        {isUser && (<>
                            <button onClick={onRevoke}>🗑️</button>
                        </>)}
                        <button onClick={onReply}>↩️</button>
                    </div>
                )}
            </div>
        </div>
    );
};