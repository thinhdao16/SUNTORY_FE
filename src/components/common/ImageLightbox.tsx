import React, { useState, useEffect, Fragment, useCallback } from "react";
import { motion, PanInfo, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { IoArrowBack, IoDownloadOutline, IoAddOutline, IoRemoveOutline, IoHeartOutline, IoHeart, IoChatbubbleOutline, IoShareSocialOutline, IoClose } from "react-icons/io5";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCoverflow } from 'swiper/modules';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { saveImage } from '@/utils/save-image';
import DownloadIcon from "@/icons/logo/download-white.png"
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

interface MediaItem {
    url: string;
    type: 'image' | 'video';
}

interface ImageLightboxProps {
    open: boolean;
    images: string[] | MediaItem[];
    initialIndex: number;
    onClose: () => void;
    userInfo?: {
        name: string;
        avatar?: string;
    };
    options?: {
        showDownload?: boolean;
        showPageIndicator?: boolean;
        showNavButtons?: boolean;
        showZoomControls?: boolean;
        enableZoom?: boolean;
        showHeader?: boolean;
        effect?: 'slide' | 'coverflow';
        spaceBetween?: number;
        showActions?: boolean;
    };
    actions?: {
        likes?: number;
        comments?: number;
        shares?: number;
        isLiked?: boolean;
        onLike?: () => void;
        onComment?: () => void;
        onShare?: () => void;
    };
    onDownload?: (imageUrl: string) => void;
    onDownloadAll?: (imageUrls: string[]) => void;
    onSlideChange?: (newIndex: number) => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
    open,
    images,
    initialIndex,
    onClose,
    userInfo,
    options = {},
    actions,
    onDownload,
    onDownloadAll,
    onSlideChange
}) => {
    const {
        showDownload = true,
        showPageIndicator = true,
        showNavButtons = true,
        showZoomControls = true,
        enableZoom = true,
        showHeader = true,
        effect = 'slide',
        spaceBetween = 50,
        showActions = false
    } = options;

    const mediaItems: MediaItem[] = React.useMemo(() => {
        if (!images || images.length === 0) return [];

        if (typeof images[0] === 'object' && 'url' in images[0]) {
            return images as MediaItem[];
        }

        return (images as string[]).map(url => ({
            url,
            type: 'image' as const
        }));
    }, [images]);

    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [swiper, setSwiper] = useState<any>(null);
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomInstances, setZoomInstances] = useState<{ [key: number]: any }>({});
    const [lastTap, setLastTap] = useState(0);
    const [isZoomChanging, setIsZoomChanging] = useState(false);

    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [isClosing, setIsClosing] = useState(false);
    const [closeDirection, setCloseDirection] = useState<'up' | 'down'>('down');
    const [dragDirection, setDragDirection] = useState<'vertical' | 'horizontal' | null>(null);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });

    const urlToBase64 = async (url: string): Promise<string> => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error converting URL to base64:', error);
            throw error;
        }
    };

    const y = useMotionValue(0);
    const scale = useTransform(y, [-200, 0, 200], [0.7, 1, 0.7]);
    const opacity = useTransform(y, [-200, 0, 200], [0.3, 1, 0.3]);
    const backgroundOpacity = useTransform(y, [-200, 0, 200], [0.3, 1, 0.3]);

    const finalScale = (isZoomed || isClosing) ? 1 : scale;
    const finalOpacity = isZoomed ? 1 : (isClosing ? 0.3 : opacity);
    const finalBackgroundOpacity = isZoomed ? 1 : (isClosing ? 0.2 : backgroundOpacity);

    useEffect(() => {
        setCurrentIndex(initialIndex);
        if (swiper) {
            swiper.slideTo(initialIndex);
        }
        setIsZoomed(false);
    }, [initialIndex, open, swiper]);
    const handleDownloadCurrent = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!mediaItems[currentIndex]) return;

        try {
            setIsDownloading(true);
            setDownloadProgress({ current: 1, total: 1 });

            const currentItem = mediaItems[currentIndex];
            const base64Data = await urlToBase64(currentItem.url);
            const fileName = `image_${currentIndex + 1}_${Date.now()}.jpg`;

            await saveImage({
                dataUrlOrBase64: base64Data,
                fileName,
                albumIdentifier: 'WayJet'
            });

            if (onDownload) {
                onDownload(currentItem.url);
            }
        } catch (error) {
            console.error('Error downloading image:', error);
        } finally {
            setIsDownloading(false);
            setDownloadProgress({ current: 0, total: 0 });
            setShowDownloadMenu(false);
        }
    };

    const handleDownloadAll = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (mediaItems.length === 0) return;

        try {
            setIsDownloading(true);
            setDownloadProgress({ current: 0, total: mediaItems.length });

            for (let i = 0; i < mediaItems.length; i++) {
                const item = mediaItems[i];
                setDownloadProgress({ current: i + 1, total: mediaItems.length });
                try {
                    const base64Data = await urlToBase64(item.url);
                    const fileName = `image_${i + 1}_${Date.now()}.jpg`;
                    await saveImage({
                        dataUrlOrBase64: base64Data,
                        fileName,
                        albumIdentifier: 'WayJet'
                    });
                    if (i < mediaItems.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                } catch (error) {
                    console.error(`Error downloading image ${i + 1}:`, error);
                }
            }
            if (onDownloadAll) {
                const allUrls = mediaItems.map(item => item.url);
                onDownloadAll(allUrls);
            }
        } catch (error) {
            console.error('Error downloading all images:', error);
        } finally {
            setIsDownloading(false);
            setDownloadProgress({ current: 0, total: 0 });
            setShowDownloadMenu(false);
        }
    };

    const toggleDownloadMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDownloadMenu(!showDownloadMenu);
    };

    const handleSlideChange = useCallback((swiper: any) => {
        if (isDragging || isClosing) return;

        setCurrentIndex(swiper.activeIndex);
        if (enableZoom) {
            setIsZoomed(false);
            const inst = zoomInstances[swiper.activeIndex];
            if (inst) requestAnimationFrame(() => inst.resetTransform());
        }
        if (onSlideChange) {
            onSlideChange(swiper.activeIndex);
        }
    }, [isDragging, isClosing, enableZoom, zoomInstances, onSlideChange]);


    const handlePrevSlide = useCallback(() => {
        if (swiper && !isDragging && !isClosing) {
            swiper.slidePrev();
        }
    }, [swiper, isDragging, isClosing]);

    const handleNextSlide = useCallback(() => {
        if (swiper && !isDragging && !isClosing) {
            swiper.slideNext();
        }
    }, [swiper, isDragging, isClosing]);

    const handleDragStart = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (isZoomed || isZoomChanging) return;

        setDragStartY(info.point.y);
        setDragDirection(null);
    }, [isZoomed, isZoomChanging]);

    const handleDrag = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (isZoomed || isZoomChanging) return;

        const deltaY = info.offset.y;
        const deltaX = info.offset.x;

        if (!dragDirection) {
            if (Math.abs(deltaY) > 10 || Math.abs(deltaX) > 10) {
                if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
                    setDragDirection('vertical');
                    setIsDragging(true);
                    if (swiper) {
                        swiper.allowTouchMove = false;
                    }
                } else if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
                    setDragDirection('horizontal');
                    y.set(0);
                    return;
                }
            }
        }

        if (dragDirection === 'vertical') {
            y.set(deltaY);
        } else if (dragDirection === 'horizontal') {
            y.set(0);
        }
    }, [isZoomed, isZoomChanging, dragDirection, y, swiper]);

    const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (isDragging && dragDirection === 'vertical') {
            setIsDragging(false);

            if (swiper) {
                swiper.allowTouchMove = true;
            }

            const deltaY = info.offset.y;
            const velocityY = info.velocity.y;

            const shouldClose = Math.abs(deltaY) > 150 || Math.abs(velocityY) > 500;
            if (shouldClose) {
                setCloseDirection(deltaY > 0 ? 'down' : 'up');
                setIsClosing(true);
                y.set(deltaY > 0 ? window.innerHeight : -window.innerHeight);
                setTimeout(() => {
                    onClose();
                }, 250);
            } else {
                y.set(0);
            }
        }

        if (!isClosing) {
            setDragDirection(null);
        }
    }, [isZoomed, isZoomChanging, isDragging, dragDirection, y, onClose, swiper, isClosing]);

    const handleZoomIn = () => {
        if (enableZoom) {
            const currentZoomInstance = zoomInstances[currentIndex];
            if (currentZoomInstance) {
                currentZoomInstance.zoomIn();
            }
        }
    };

    const handleZoomOut = () => {
        if (enableZoom) {
            const currentZoomInstance = zoomInstances[currentIndex];
            if (currentZoomInstance) {
                currentZoomInstance.zoomOut();
            }
        }
    };
    const handleZoomChange = (ref: any) => {
        const { scale } = ref.state;
        setIsZoomChanging(true);
        const newIsZoomed = scale > 1;
        setIsZoomed(newIsZoomed);

        if (newIsZoomed) {
            y.set(0);
            setIsDragging(false);
        }

        setTimeout(() => {
            setIsZoomChanging(false);
        }, 300);
    };
    const handleImageClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!enableZoom) return;

        const currentZoomInstance = zoomInstances[currentIndex];
        if (!currentZoomInstance) return;

        if (isZoomed) {
            currentZoomInstance.resetTransform();
            setIsZoomed(false);
        } else {
            const now = Date.now();
            const DOUBLE_TAP_DELAY = 150;

            if (now - lastTap < DOUBLE_TAP_DELAY) {
                currentZoomInstance.zoomIn(0.5);
                setLastTap(0);
                setIsZoomed(true);
            } else {
                setLastTap(now);
            }
        }
    };
    useEffect(() => {
        if (open) {
            setIsClosing(false);
            setIsDragging(false);
            setCloseDirection('down');
            setDragDirection(null);
            setShowDownloadMenu(false);
            setIsDownloading(false);
            setDownloadProgress({ current: 0, total: 0 });
            y.set(0);
        } else {
            setTimeout(() => {
                setIsClosing(false);
                setIsDragging(false);
                setCloseDirection('down');
                setDragDirection(null);
                setShowDownloadMenu(false);
                setIsDownloading(false);
                setDownloadProgress({ current: 0, total: 0 });
            }, 300);
        }
    }, [open, y]);

    useEffect(() => {
        if (showDownloadMenu) {
            const handleClickOutside = () => setShowDownloadMenu(false);
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showDownloadMenu]);

    useEffect(() => {
        setShowDownloadMenu(false);
    }, [currentIndex]);
    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <motion.div
                        className="fixed inset-0 bg-black"
                        style={{ opacity: isClosing ? 0 : finalBackgroundOpacity }}
                    />
                </TransitionChild>
                <div className="fixed inset-0 overflow-hidden">
                    <div className="flex min-h-full items-center justify-center">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="w-full h-screen relative">
                                <>
                                    <AnimatePresence>
                                        {showHeader && !dragDirection && !isClosing && (
                                            <motion.div
                                                className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/50 to-transparent"
                                                initial={{ opacity: 0, y: -20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className="flex items-center justify-between p-4 pt-12">
                                                    <div className="flex items-center">
                                                        <button
                                                            onClick={onClose}
                                                            className="bg-[#FFFFFF33] p-0.5 rounded-full hover:bg-white/10 transition-colors"
                                                        >
                                                            <IoClose className="text-white text-2xl" />
                                                        </button>
                                                        {userInfo && (
                                                            <div className="flex items-center ml-3">
                                                                <div className="w-8 h-8 rounded-xl overflow-hidden bg-gray-600 flex items-center justify-center">
                                                                    {userInfo.avatar ? (
                                                                        <img
                                                                            src={userInfo.avatar}
                                                                            alt={userInfo.name}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <span className="text-white text-sm font-medium">
                                                                            {userInfo.name.charAt(0).toUpperCase()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-white font-medium ml-2 max-w-40 truncate">
                                                                    {userInfo.name}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center">
                                                        {showZoomControls && enableZoom && isZoomed && (
                                                            <button
                                                                onClick={handleZoomOut}
                                                                className="p-2 rounded-full transition-colors mr-2 text-white hover:bg-white/10"
                                                            >
                                                                <IoRemoveOutline className="text-xl" />
                                                            </button>
                                                        )}
                                                        {showZoomControls && enableZoom && (
                                                            <button
                                                                onClick={handleZoomIn}
                                                                className="p-2 rounded-full transition-colors mr-2 text-white hover:bg-white/10"
                                                            >
                                                                <IoAddOutline className="text-xl" />
                                                            </button>
                                                        )}
                                                        {showDownload && (
                                                            <div className="relative flex   gap-2">
                                                                {mediaItems.length > 1 && (
                                                                    <button
                                                                        onClick={handleDownloadAll}
                                                                        disabled={isDownloading}
                                                                        className={`w-full bg-[#FFFFFF33] rounded-full px-4  text-center text-white transition-colors flex items-center gap-2 ${isDownloading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
                                                                            }`}
                                                                    >
                                                                        <span>{t('Save all images')}</span>
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={handleDownloadCurrent}
                                                                    disabled={isDownloading}
                                                                    className={`rounded-full h-8 w-8 aspect-square  bg-[#FFFFFF33] flex items-center justify-center ${isDownloading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}`}
                                                                >
                                                                    <img src={DownloadIcon} alt="" />
                                                                </button>
                                                                <div className="absolute right-0 top-full mt-2 bg-black/90 backdrop-blur-sm rounded-lg py-2 min-w-[200px] z-50">
                                                                    {isDownloading && (
                                                                        <div className="px-4 py-2 text-white text-sm">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                                <span>Đang tải... ({downloadProgress.current}/{downloadProgress.total})</span>
                                                                            </div>
                                                                            <div className="w-full bg-white/20 rounded-full h-1">
                                                                                <div
                                                                                    className="bg-white h-1 rounded-full transition-all duration-300"
                                                                                    style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
                                                                                ></div>
                                                                            </div>
                                                                        </div>
                                                                    )}


                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <motion.div
                                        className="w-full h-full relative"
                                        drag={!isZoomed && !isZoomChanging && !isClosing ? "y" : false}
                                        dragConstraints={{ top: -400, bottom: 400 }}
                                        dragElastic={{ top: 0.2, bottom: 0.2 }}
                                        dragMomentum={false}
                                        onDragStart={handleDragStart}
                                        onDrag={handleDrag}
                                        onDragEnd={handleDragEnd}
                                        style={{ y: isZoomed ? 0 : y }}
                                        animate={isClosing ? {
                                            y: closeDirection === 'down' ? window.innerHeight : -window.innerHeight,
                                            opacity: 0
                                        } : isZoomed ? {
                                            y: 0
                                        } : undefined}
                                        transition={isClosing ? {
                                            type: "tween",
                                            duration: 0.25,
                                            ease: "easeInOut"
                                        } : isZoomed ? {
                                            type: "spring",
                                            damping: 25,
                                            stiffness: 300,
                                            mass: 0.8
                                        } : undefined}
                                    >
                                        <motion.div
                                            className="absolute top-0 bottom-0 left-0 right-0 flex items-center justify-center"
                                            style={{
                                                scale: isClosing ? 1 : finalScale,
                                                opacity: isClosing ? 1 : finalOpacity
                                            }}
                                        >
                                            <Swiper
                                                allowTouchMove={!isZoomed && !isClosing}
                                                modules={[Navigation, Pagination, EffectCoverflow]}
                                                spaceBetween={spaceBetween}
                                                slidesPerView={1}
                                                centeredSlides={true}
                                                initialSlide={initialIndex}
                                                effect={effect}
                                                coverflowEffect={{
                                                    rotate: 0,
                                                    stretch: 0,
                                                    depth: 100,
                                                    modifier: 2,
                                                    slideShadows: false,
                                                }}
                                                navigation={{
                                                    nextEl: '.swiper-button-next-custom',
                                                    prevEl: '.swiper-button-prev-custom',
                                                }}
                                                pagination={{
                                                    el: '.swiper-pagination-custom',
                                                    clickable: true,
                                                }}
                                                onSwiper={setSwiper}
                                                onSlideChange={handleSlideChange}
                                                className="h-full w-full"
                                            >
                                                {mediaItems.map((item, index) => (
                                                    <SwiperSlide key={index} className="!flex items-center justify-center h-full">
                                                        <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
                                                            {enableZoom && index === currentIndex ? (
                                                                <div
                                                                    className="w-full h-full flex items-center justify-center"
                                                                    style={{
                                                                        touchAction: 'manipulation'
                                                                    }}
                                                                >
                                                                    <TransformWrapper
                                                                        initialScale={1}
                                                                        minScale={1}
                                                                        maxScale={3}
                                                                        doubleClick={{
                                                                            disabled: false,
                                                                            mode: "toggle",
                                                                            step: 0.7
                                                                        }}
                                                                        wheel={{
                                                                            disabled: false,
                                                                            step: 0.1
                                                                        }}
                                                                        pinch={{
                                                                            disabled: false,
                                                                            step: 0.1
                                                                        }}
                                                                        panning={{
                                                                            disabled: !isZoomed,
                                                                            velocityDisabled: true
                                                                        }}
                                                                        onInit={(ref) => {
                                                                            setZoomInstances(prev => ({
                                                                                ...prev,
                                                                                [index]: ref
                                                                            }));
                                                                        }}
                                                                        onZoom={handleZoomChange}
                                                                        onPanning={handleZoomChange}
                                                                        limitToBounds={true}
                                                                        centerOnInit={true}
                                                                        smooth={true}
                                                                    >
                                                                        <TransformComponent
                                                                            wrapperClass="!w-full !h-full flex items-center justify-center"
                                                                            contentClass="flex items-center justify-center w-full h-full"
                                                                            wrapperStyle={{
                                                                                width: '100%',
                                                                                height: '100%',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center'
                                                                            }}
                                                                            contentStyle={{
                                                                                width: '100%',
                                                                                height: '100%',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center'
                                                                            }}
                                                                        >
                                                                            {item.type === 'video' ? (
                                                                                <video
                                                                                    src={item.url}
                                                                                    className="h-fit object-contain"
                                                                                    controls
                                                                                    autoPlay={false}
                                                                                    playsInline
                                                                                    style={{
                                                                                        touchAction: 'none',
                                                                                        userSelect: 'none'
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <img
                                                                                    src={item.url}
                                                                                    alt={`Image ${index + 1}`}
                                                                                    className="h-full object-contain"
                                                                                    draggable={false}
                                                                                    onClick={handleImageClick}
                                                                                    style={{
                                                                                        touchAction: 'none',
                                                                                        userSelect: 'none',
                                                                                        pointerEvents: 'auto',
                                                                                        cursor: isZoomed ? 'zoom-out' : 'default'
                                                                                    }}
                                                                                />
                                                                            )}
                                                                        </TransformComponent>
                                                                    </TransformWrapper>
                                                                </div>
                                                            ) : (
                                                                item.type === 'video' ? (
                                                                    <video
                                                                        src={item.url}
                                                                        className="max-w-full max-h-full object-contain"
                                                                        controls
                                                                        autoPlay={false}
                                                                        playsInline
                                                                        onClick={e => e.stopPropagation()}
                                                                    />
                                                                ) : (
                                                                    <img
                                                                        src={item.url}
                                                                        alt={`Image ${index + 1}`}
                                                                        className="max-w-full max-h-full object-contain"
                                                                        onClick={e => e.stopPropagation()}
                                                                        draggable={false}
                                                                        style={{
                                                                            userSelect: 'none',
                                                                            touchAction: 'manipulation'
                                                                        }}
                                                                    />
                                                                )
                                                            )}
                                                        </div>
                                                    </SwiperSlide>
                                                ))}
                                            </Swiper>
                                        </motion.div>
                                    </motion.div>
                                    <AnimatePresence>
                                        {showNavButtons && mediaItems.length > 1 && !dragDirection && !isClosing && (
                                            <>
                                                <motion.button
                                                    onClick={handlePrevSlide}
                                                    className="fixed left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 z-10"
                                                    whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.8)" }}
                                                    whileTap={{ scale: 0.95 }}
                                                    initial={{ opacity: 0.7 }}
                                                    animate={{ opacity: 1 }}
                                                >
                                                    <span className="text-2xl font-bold">‹</span>
                                                </motion.button>
                                                <motion.button
                                                    onClick={handleNextSlide}
                                                    className="fixed right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 z-10"
                                                    whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.8)" }}
                                                    whileTap={{ scale: 0.95 }}
                                                    initial={{ opacity: 0.7 }}
                                                    animate={{ opacity: 1 }}
                                                >
                                                    <span className="text-2xl font-bold">›</span>
                                                </motion.button>
                                            </>
                                        )}
                                    </AnimatePresence>
                                    {/* Actions Bar - Hide when dragging */}
                                    <AnimatePresence>
                                        {showActions && actions && !isDragging && !dragDirection && !isClosing && (
                                            <motion.div
                                                className="fixed bottom-20 left-0 right-0 z-50 px-4"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 20 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-3 flex items-center justify-around max-w-sm mx-auto">
                                                    {/* Like Button */}
                                                    <button
                                                        onClick={actions.onLike}
                                                        className="flex items-center gap-2 text-white hover:scale-110 transition-transform"
                                                    >
                                                        {actions.isLiked ? (
                                                            <IoHeart className="text-2xl text-red-500" />
                                                        ) : (
                                                            <IoHeartOutline className="text-2xl" />
                                                        )}
                                                        {actions.likes !== undefined && (
                                                            <span className="text-sm">{actions.likes}</span>
                                                        )}
                                                    </button>

                                                    {/* Comment Button */}
                                                    <button
                                                        onClick={actions.onComment}
                                                        className="flex items-center gap-2 text-white hover:scale-110 transition-transform"
                                                    >
                                                        <IoChatbubbleOutline className="text-2xl" />
                                                        {actions.comments !== undefined && (
                                                            <span className="text-sm">{actions.comments}</span>
                                                        )}
                                                    </button>

                                                    {/* Share Button */}
                                                    <button
                                                        onClick={actions.onShare}
                                                        className="flex items-center gap-2 text-white hover:scale-110 transition-transform"
                                                    >
                                                        <IoShareSocialOutline className="text-2xl" />
                                                        {actions.shares !== undefined && (
                                                            <span className="text-sm">{actions.shares}</span>
                                                        )}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
                                        {enableZoom && isZoomed && zoomInstances[currentIndex] && (
                                            <div className="bg-black/60 text-white px-3 py-1 rounded-full text-sm mb-2">
                                                {Math.round(zoomInstances[currentIndex].state.scale * 100)}%
                                            </div>
                                        )}
                                        {showPageIndicator && mediaItems.length > 1 && (
                                            <div className="bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                                                {currentIndex + 1} / {mediaItems.length}
                                            </div>
                                        )}
                                    </div>
                                </>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ImageLightbox;