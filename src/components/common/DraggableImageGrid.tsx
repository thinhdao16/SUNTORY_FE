import React, { useMemo, useState, useRef, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult, DragUpdate } from "react-beautiful-dnd";
import { IoClose } from "react-icons/io5";
import { MdDragIndicator } from "react-icons/md";
import { ImageItem } from "@/utils/imageUpload";

interface DraggableImageGridProps {
    images: ImageItem[];
    onRemoveImage?: (index: number) => void;
    onReorderImages?: (newImages: ImageItem[]) => void;
    className?: string;
    targetHeight?: number;
    minItemWidth?: number;
    gap?: number;
    fit?: "contain" | "cover";
    snap?: boolean;
    showRemoveButton?: boolean;
    showDragHandle?: boolean;
    enableDragDrop?: boolean;
    dragFromTopArea?: boolean;
}

export const DraggableImageGrid: React.FC<DraggableImageGridProps> = ({
    images,
    onRemoveImage,
    onReorderImages,
    className = "",
    targetHeight = 260,
    minItemWidth = 120,
    gap = 8,
    fit = "contain",
    snap = true,
    showRemoveButton = true,
    showDragHandle = true,
    enableDragDrop = true,
    dragFromTopArea = false,
}) => {
    if (!images || images.length === 0) return null;

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const imagesWithIds = useMemo(() =>
        images.map((img, index) => ({
            ...img,
            id: img.id || `image-${index}-${Date.now()}`
        })),
        [images]
    );

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const scrollToEnd = () => {
            container.scrollTo({
                left: container.scrollWidth,
                behavior: 'smooth'
            });
        };
        const timeoutId = setTimeout(scrollToEnd, 100);
        
        return () => clearTimeout(timeoutId);
    }, [images.length]);

    useEffect(() => {
        if (!isDragging) return;

        let animationId: number;
        const scrollSpeed = 8;
        const scrollZone = 80;
        let shouldScrollLeft = false;
        let shouldScrollRight = false;

        const updateScrollState = () => {
            const container = scrollContainerRef.current;
            if (!container) return;

            const maxScrollLeft = container.scrollWidth - container.clientWidth;
            setCanScrollLeft(container.scrollLeft > 0);
            setCanScrollRight(container.scrollLeft < maxScrollLeft);
        };

        const handleMouseMove = (e: MouseEvent | TouchEvent) => {
            const container = scrollContainerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const clientX = "touches" in e ? e.touches[0]?.clientX || 0 : e.clientX;
            const mouseX = clientX - rect.left;
            const containerWidth = rect.width;
            const maxScrollLeft = container.scrollWidth - container.clientWidth;

            shouldScrollLeft = false;
            shouldScrollRight = false;
            if (mouseX < scrollZone && container.scrollLeft > 0) {
                shouldScrollLeft = true;
                console.log('Should scroll left, mouseX:', mouseX, 'scrollZone:', scrollZone, 'isMobile:', "touches" in e);
            }
            else if (mouseX > containerWidth - scrollZone && container.scrollLeft < maxScrollLeft) {
                shouldScrollRight = true;
                console.log('Should scroll right, mouseX:', mouseX, 'containerWidth:', containerWidth, 'scrollZone:', scrollZone, 'isMobile:', "touches" in e);
            }

            updateScrollState();
        };

        const performScroll = () => {
            const container = scrollContainerRef.current;
            if (!container) return;

            if (shouldScrollLeft) {
                const newScrollLeft = Math.max(0, container.scrollLeft - scrollSpeed);
                container.scrollLeft = newScrollLeft;
                console.log('Scrolling left:', newScrollLeft);
            } else if (shouldScrollRight) {
                const maxScrollLeft = container.scrollWidth - container.clientWidth;
                const newScrollLeft = Math.min(maxScrollLeft, container.scrollLeft + scrollSpeed);
                container.scrollLeft = newScrollLeft;
                console.log('Scrolling right:', newScrollLeft);
            }

            if (isDragging) {
                animationId = requestAnimationFrame(performScroll);
            }
        };
        updateScrollState();

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('touchstart', handleMouseMove as any, { passive: false });
        document.addEventListener('touchmove', handleMouseMove as any, { passive: false });

        animationId = requestAnimationFrame(performScroll);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('touchstart', handleMouseMove as any);
            document.removeEventListener('touchmove', handleMouseMove as any);
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [isDragging]);

    const handleDragStart = () => {
        setIsDragging(true);
    };

    const handleDragUpdate = (update: DragUpdate) => {
        return;
    };

    const handleDragEnd = (result: DropResult) => {
        setIsDragging(false);

        if (!result.destination || !onReorderImages) return;

        const items = Array.from(imagesWithIds);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        onReorderImages(items);
    };

    const wrapperStyle: React.CSSProperties = useMemo(
        () => ({
            columnGap: `${gap}px`,
            WebkitOverflowScrolling: "touch",
        }),
        [gap]
    );

    const content = (
        <div
            ref={scrollContainerRef}
            className={`flex overflow-x-auto pb-2 ${snap ? "snap-x snap-mandatory" : ""} ${isDragging ? "scroll-smooth" : ""
                }`}
            style={wrapperStyle}
        >
            {imagesWithIds.map((img, idx) => {
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

                if (enableDragDrop) {
                    return (
                        <Draggable key={img.id} draggableId={img.id!} index={idx}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`${snap ? "snap-start" : ""} transition-transform duration-200 ease-out`}
                                    style={{

                                        ...provided.draggableProps.style,
                                        transform: snapshot.isDragging
                                            ? provided.draggableProps.style?.transform
                                            : 'translate(0px, 0px)'
                                    }}
                                >
                                    <DraggableStripItem
                                        src={src}
                                        width={itemWidth}
                                        height={itemHeight}
                                        isUploading={!!img.isUploading}
                                        uploadError={!!img.uploadError}
                                        fit={fit}
                                        snap={snap}
                                        isDragging={snapshot.isDragging}
                                        onRemove={showRemoveButton && onRemoveImage ? () => onRemoveImage(idx) : undefined}
                                        showDragHandle={showDragHandle}
                                        dragHandleProps={provided.dragHandleProps}
                                        dragFromTopArea={dragFromTopArea}
                                    />
                                </div>
                            )}
                        </Draggable>
                    );
                } else {
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
                }
            })}
        </div>
    );

    if (enableDragDrop) {
        return (
            <div className={`w-full ${className} relative`}>
                {isDragging && (
                    <>
                        {canScrollLeft && (
                            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-blue-500/30 to-transparent z-10 pointer-events-none flex items-center justify-start pl-2">
                                <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium shadow-lg animate-pulse">
                                    ← Scroll
                                </div>
                            </div>
                        )}
                        {canScrollRight && (
                            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-blue-500/30 to-transparent z-10 pointer-events-none flex items-center justify-end pr-2">
                                <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium shadow-lg animate-pulse">
                                    Scroll →
                                </div>
                            </div>
                        )}
                    </>
                )}

                <DragDropContext onDragStart={handleDragStart} onDragUpdate={handleDragUpdate} onDragEnd={handleDragEnd}>
                    <Droppable droppableId="images" direction="horizontal">
                        {(provided, snapshot) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className={`transition-colors duration-300 ease-out ${snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg' : ''
                                    }`}
                                style={{

                                    minHeight: targetHeight,
                                    padding: snapshot.isDraggingOver ? '8px' : '0px'
                                }}
                            >
                                {content}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
        );
    }

    return (
        <div className={`w-full ${className}`}>
            {content}
        </div>
    );
};

const DraggableStripItem: React.FC<{
    src: string;
    width: number;
    height: number;
    isUploading: boolean;
    uploadError: boolean;
    fit: "contain" | "cover";
    snap: boolean;
    isDragging: boolean;
    onRemove?: () => void;
    showDragHandle: boolean;
    dragHandleProps?: any;
    dragFromTopArea?: boolean;
}> = ({
    src,
    width,
    height,
    isUploading,
    uploadError,
    fit,
    snap,
    isDragging,
    onRemove,
    showDragHandle,
    dragHandleProps,
    dragFromTopArea = false
}) => {
        const [loaded, setLoaded] = useState(false);

        return (
            <div
                className={`relative flex-none rounded-2xl overflow-hidden bg-gray-100 transition-all duration-300 ease-out ${isDragging ? "shadow-2xl scale-102 rotate-0.5 ring-2 ring-blue-400 ring-opacity-50" : "shadow-sm hover:shadow-md"
                    }`}
                style={{
                    width, height
                }}
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
                        style={{
                            objectPosition: "center"
                        }}
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
                        style={{
                            objectPosition: "center"
                        }}
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

                {/* Drag Handle - Enhanced for wide images */}
                {showDragHandle && (
                    <>
                        {/* Main drag handle */}
                        <div
                            {...dragHandleProps}
                            className="absolute top-2 left-2 w-9 h-9 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-all duration-200 cursor-grab active:cursor-grabbing hover:scale-110 shadow-lg z-10"
                            aria-label="Drag to reorder"
                            style={{
                                touchAction: 'none'
                            }}
                        >
                            <MdDragIndicator className="w-5 h-5 text-white" />
                        </div>

                        {/* Extended drag area for wide images */}
                        {width > 250 && (
                            <div
                                {...dragHandleProps}
                                className="absolute top-2 left-12 right-12 h-9 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center transition-all duration-200 cursor-grab active:cursor-grabbing opacity-0 hover:opacity-100"
                                aria-label="Drag to reorder"
                                style={{
                                    touchAction: 'none'
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <MdDragIndicator className="w-4 h-4 text-white" />
                                    <span className="text-xs text-white font-medium">Drag to reorder</span>
                                    <MdDragIndicator className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        )}

                        {width > 350 && (
                            <div
                                {...dragHandleProps}
                                className="absolute top-2 right-12 w-9 h-9 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-all duration-200 cursor-grab active:cursor-grabbing hover:scale-110 shadow-lg opacity-75 hover:opacity-100"
                                aria-label="Drag to reorder"
                                style={{
                                    touchAction: 'none'
                                }}
                            >
                                <MdDragIndicator className="w-5 h-5 text-white" />
                            </div>
                        )}
                    </>
                )}

                {dragFromTopArea && width > 200 && (
                    <div
                        {...dragHandleProps}
                        className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/20 to-transparent cursor-grab active:cursor-grabbing opacity-0 hover:opacity-100 transition-opacity duration-200"
                        aria-label="Drag to reorder"
                        style={{
                            touchAction: 'none'
                        }}
                    >
                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                            <div className="flex items-center gap-1 px-3 py-1 bg-black/60 rounded-full">
                                <MdDragIndicator className="w-3 h-3 text-white" />
                                <span className="text-xs text-white font-medium">Drag</span>
                                <MdDragIndicator className="w-3 h-3 text-white" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Remove Button */}
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

                {/* Drag overlay */}
                {isDragging && (
                    <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 border-dashed rounded-2xl" />
                )}
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
            className={`relative flex-none rounded-2xl overflow-hidden bg-gray-100 ${snap ? "snap-start" : ""}`}
            style={{
                width, height
            }}
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
                    style={{
                        objectPosition: "center"
                    }}
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
                    style={{
                        objectPosition: "center"
                    }}
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

export default DraggableImageGrid;
