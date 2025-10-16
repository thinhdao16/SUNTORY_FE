import AppImage from "@/components/common/AppImage";
import ImageLightbox from "@/components/common/ImageLightbox";
import { MediaType } from "@/utils/imageUpload";
import React, { useState, useRef, useEffect } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { MdOutlineReply } from "react-icons/md";

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
    hasReachedLimit: boolean;
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

const MAX_PREVIEW = 4;

export const ImageGallery: React.FC<ImageGalleryProps> = ({
    chatAttachments,
    isUser,
    onImageClick,
    isRevoked,
    actionContainerRef,
    onEdit,
    onRevoke,
    onReply,
    showActionsMobile,
    hasReachedLimit = false
}) => {
    const [showAll, setShowAll] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxItems, setLightboxItems] = useState<Array<{ url: string; type: 'image' | 'video'; s3Key?: string; fileName?: string }>>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const mediaFiles = chatAttachments.filter((file: any) => {
        const fileName = file.fileName || "";
        return /\.(jpg|jpeg|png|gif|webp|mp4|avi|mov|wmv|flv|webm|mkv|m4v)$/i.test(fileName);
    });

    const sortedMediaFiles = mediaFiles.sort((a: any, b: any) => {
        const indexA = a.originalIndex ?? 0;
        const indexB = b.originalIndex ?? 0;
        return indexA - indexB;
    });

    const photoAlbumPhotos = sortedMediaFiles.map((file: any, index: number) => ({
        src: file.fileUrl,
        serverSrc: file.serverUrl,
        width: 800,
        height: 600,
        attachment: file,
        stableKey: file.tempAttachmentId || file.id || `media_${index}`,
        mediaType: /\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v)$/i.test(file.fileName || "") ? "video" : "image"
    }));

    const displayPhotos = showAll ? photoAlbumPhotos : photoAlbumPhotos.slice(0, MAX_PREVIEW);
    const remaining = Math.max(0, photoAlbumPhotos.length - MAX_PREVIEW);
    const [ref1, ref2, bottomHeight] = useOddLastImageHeight(photoAlbumPhotos);

    const handleImageClick = (idx: number) => {
        const allImages = photoAlbumPhotos.map((p: { src: string }) => p.src);
        const allItems = photoAlbumPhotos.map((p: any) => ({
            url: p.src,
            type: (p.mediaType === 'video' ? 'video' : 'image') as 'image' | 'video',
            s3Key: p?.attachment?.s3Key,
            fileName: p?.attachment?.fileName,
        }));
        setLightboxItems(allItems);
        setLightboxIndex(idx);
        setLightboxOpen(true);
        onImageClick(idx, allImages);
    };

    if (mediaFiles.length === 0) return null;

    return (
        <div className={isUser ? "self-end w-fit" : "self-start w-fit"}>
            <div className={`mb-2 z-1 space-y-2 relative ${isUser ? "ml-auto" : "mr-auto"} w-fit group`}>
                <div
                    className={
                        displayPhotos.length === 1 ? `w-[70vw] lg:w-[320px] xl:w-[320px] rounded-2xl overflow-hidden flex ${isUser ? "justify-end" : "justify-start"}`
                            : displayPhotos.length === 2
                                ? "grid  w-[70vw] lg:w-[320px] xl:w-[320px] rounded-2xl overflow-hidden grid-cols-2 gap-1 border border-netural-100"
                                : displayPhotos.length === 3
                                    ? "grid  w-[70vw] lg:w-[320px] xl:w-[320px] rounded-2xl overflow-hidden grid-cols-2 grid-rows-2 gap-1 border border-netural-100"
                                    : "grid  w-[70vw] lg:w-[320px] xl:w-[320px] rounded-2xl overflow-hidden grid-cols-2 gap-1 border border-netural-100"
                    }
                >
                    {displayPhotos.map((photo: {
                        src: any;
                        serverSrc: any;
                        width: number;
                        height: number;
                        attachment: any;
                        stableKey: any;
                        mediaType: string;
                    }, idx: number) => {
                        const attachment = photo.attachment;
                        const isUploading = attachment?.isUploading;
                        const uploadProgress = attachment?.uploadProgress || 0;
                        const isError = attachment?.isError;
                        const isSending = attachment?.isSending;
                        const isLast = !showAll && idx === MAX_PREVIEW - 1 && remaining > 0;
                        const isLastOdd = displayPhotos.length % 2 === 1 && idx === displayPhotos.length - 1;
                        const isSecondLast = displayPhotos.length % 2 === 1 && idx === displayPhotos.length - 2;
                        const isThirdLast = displayPhotos.length % 2 === 1 && idx === displayPhotos.length - 3;

                        const renderOverlay = () => {
                            if (isError) {
                                return (
                                    <div className="absolute inset-0  bg-red-500/20 rounded-2xl flex items-center justify-center z-10">
                                        <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                                            {t("Upload failed")}
                                        </div>
                                    </div>
                                );
                            }

                            if (isSending) {
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

                            if (isUploading) {
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

                        const videoProps = photo.mediaType === "video" ? {
                            controls: true,
                            preload: "metadata" as const,
                            playsInline: true,
                            muted: true
                        } : {};

                        if (displayPhotos.length === 1) {
                            return (
                                <div key={photo.stableKey} className="relative w-full rounded-2xl overflow-hidden">
                                    <AppImage
                                        src={photo.src}
                                        serverSrc={photo.serverSrc}
                                        alt=""
                                        fit="cover"
                                        wrapperClassName="w-full rounded-2xl overflow-hidden"
                                        className="rounded-2xl"
                                        onClick={() => handleImageClick(idx)}
                                        style={{ cursor: "pointer" }}
                                        mediaType={photo.mediaType}
                                        videoProps={videoProps}
                                    />
                                    {renderOverlay()}
                                </div>
                            );
                        }

                        if (displayPhotos.length === 3 && idx === 2) {
                            return (
                                <div
                                    key={photo.stableKey}
                                    className="relative col-span-2 w-full h-[200px] rounded-b-2xl overflow-hidden cursor-pointer"
                                    onClick={() => handleImageClick(idx)}
                                >
                                    <AppImage
                                        src={photo.src}
                                        serverSrc={photo.serverSrc}
                                        alt=""
                                        fit="cover"
                                        className="w-full h-full object-cover rounded-b-2xl"
                                        mediaType={photo.mediaType}
                                        videoProps={videoProps}
                                    />
                                    {renderOverlay()}
                                </div>
                            );
                        }

                        if (isLast && isLastOdd) {
                            return (
                                <div
                                    key={photo.stableKey}
                                    className="relative object-cover rounded-2xl col-span-2 w-full h-[180px] cursor-pointer overflow-hidden"
                                    style={{ gridColumn: "1 / span 2" }}
                                    onClick={() => handleImageClick(idx)}
                                >
                                    <AppImage
                                        src={photo.src}
                                        serverSrc={photo.serverSrc}
                                        alt=""
                                        className="w-full h-full object-cover rounded-2xl"
                                        style={{ filter: "brightness(0.7)" }}
                                        mediaType={photo.mediaType}
                                        videoProps={videoProps}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-white font-bold text-2xl bg-black/50 px-4 py-2 rounded-2xl select-none pointer-events-none">
                                            +{remaining}
                                        </span>
                                    </div>
                                    {renderOverlay()}
                                </div>
                            );
                        }

                        if (isLast) {
                            return (
                                <div
                                    key={photo.stableKey}
                                    className="relative object-cover rounded-br-2xl w-full h-full cursor-pointer overflow-hidden"
                                    onClick={() => handleImageClick(idx)}
                                >
                                    <AppImage
                                        src={photo.src}
                                        serverSrc={photo.serverSrc}
                                        alt=""
                                        className="w-full h-full object-cover rounded-2xl"
                                        style={{ filter: "brightness(0.7)" }}
                                        mediaType={photo.mediaType}
                                        videoProps={videoProps}
                                    />
                                    <div className="absolute inset-0 rounded-2xl flex items-center justify-center">
                                        <span className="text-white font-bold text-2xl bg-black/50 px-4 py-2 rounded-2xl select-none pointer-events-none">
                                            +{remaining}
                                        </span>
                                    </div>
                                    {renderOverlay()}
                                </div>
                            );
                        }

                        if (isLastOdd) {
                            return (
                                <div key={photo.stableKey} className="relative w-full">
                                    <AppImage
                                        src={photo.src}
                                        serverSrc={photo.serverSrc}
                                        alt=""
                                        onClick={() => handleImageClick(idx)}
                                        className="object-cover rounded-2xl col-span-2 w-full"
                                        style={{
                                            gridColumn: "1 / span 2",
                                            cursor: "pointer",
                                            height: bottomHeight || 180,
                                            objectFit: "cover",
                                        }}
                                        mediaType={photo.mediaType}
                                        videoProps={videoProps}
                                    />
                                    {renderOverlay()}
                                </div>
                            );
                        }

                        if (isThirdLast) {
                            return (
                                <div key={photo.stableKey} className="relative w-full h-full">
                                    <AppImage
                                        src={photo.src}
                                        serverSrc={photo.serverSrc}
                                        alt=""
                                        ref={ref1}
                                        onClick={() => handleImageClick(idx)}
                                        className="object-cover  w-full h-full"
                                        style={{ cursor: "pointer" }}
                                        mediaType={photo.mediaType}
                                        videoProps={videoProps}
                                    />
                                    {renderOverlay()}
                                </div>
                            );
                        }

                        if (isSecondLast) {
                            return (
                                <div key={photo.stableKey} className="relative w-full h-full">
                                    <AppImage
                                        src={photo.src}
                                        serverSrc={photo.serverSrc}
                                        alt=""
                                        ref={ref2}
                                        onClick={() => handleImageClick(idx)}
                                        className="object-cover  w-full h-full"
                                        style={{ cursor: "pointer" }}
                                        mediaType={photo.mediaType}
                                        videoProps={videoProps}
                                    />
                                    {renderOverlay()}
                                </div>
                            );
                        }

                        return (
                            <div key={photo.stableKey} className="relative w-full h-full">
                                <AppImage
                                    src={photo.src}
                                    serverSrc={photo.serverSrc}
                                    alt=""
                                    onClick={() => handleImageClick(idx)}
                                    className="object-cover  w-full h-full"
                                    style={{ cursor: "pointer" }}
                                    mediaType={photo.mediaType}
                                    videoProps={videoProps}
                                />
                                {renderOverlay()}
                            </div>
                        );
                    })}
                </div>

                {!isRevoked && (
                    <div
                        ref={actionContainerRef}
                        className={[
                            "absolute z-10 gap-2 p-1 items-center",
                            "top-1/2 -translate-y-1/2",
                            showActionsMobile ? "flex" : "hidden group-hover:flex",
                            isUser ? "-left-16" : "left-full ml-2",
                            "w-auto text-main",
                        ].join(" ")}
                        style={{ pointerEvents: "auto" }}
                    >
                        {isUser && (
                            <button onClick={onRevoke}>
                                <FaRegTrashAlt className="z-99 text-2xl" />
                            </button>
                        )}
                        {!hasReachedLimit && (
                            <button onClick={onReply}>
                                <MdOutlineReply className="z-99 text-2xl" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <ImageLightbox
                open={lightboxOpen}
                images={lightboxItems}
                initialIndex={lightboxIndex}
                onClose={() => setLightboxOpen(false)}
                options={{
                    showDownload: true,
                    showPageIndicator: true,
                    showNavButtons: false,
                    enableZoom: true,
                    showHeader: true,
                    effect: 'slide',
                    spaceBetween: 50,
                    showActions: false,
                    showZoomControls: false
                }}
            />
        </div>
    );
};