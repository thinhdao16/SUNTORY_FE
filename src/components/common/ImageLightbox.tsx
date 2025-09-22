import React, { useState, useEffect, Fragment, useRef } from "react";
import { motion, PanInfo, useDragControls, useMotionValue, useTransform } from "framer-motion";
import { IoArrowBack, IoDownloadOutline, IoAddOutline, IoRemoveOutline } from "react-icons/io5";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCoverflow } from 'swiper/modules';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

interface ImageLightboxProps {
    open: boolean;
    images: string[];
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
    };
    onDownload?: (imageUrl: string) => void;
    onSlideChange?: (newIndex: number) => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
    open,
    images,
    initialIndex,
    onClose,
    userInfo,
    options = {},
    onDownload,
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
        spaceBetween = 50
    } = options;

    const dragControls = useDragControls();
    const startRef = useRef<{ x: number; y: number } | null>(null);
    const [draggingV, setDraggingV] = useState(false);

    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [swiper, setSwiper] = useState<any>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragDirection, setDragDirection] = useState<'vertical' | 'horizontal' | null>(null);
    const [shouldSnapBack, setShouldSnapBack] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomInstances, setZoomInstances] = useState<{ [key: number]: any }>({});
    const [lastTap, setLastTap] = useState(0);
    const [isZoomChanging, setIsZoomChanging] = useState(false);
    const y = useMotionValue(0);
    const motionScale = useTransform(y, [-150, 0, 150], [0.8, 1, 0.8]);
    const opacity = useTransform(y, [-150, 0, 150], [0.5, 1, 0.5]);

    useEffect(() => {
        setCurrentIndex(initialIndex);
        if (swiper) {
            swiper.slideTo(initialIndex);
        }
        setIsZoomed(false);
    }, [initialIndex, open, swiper]);
    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDownload && images[currentIndex]) {
            onDownload(images[currentIndex]);
        }
    };

const handleSlideChange = (swiper: any) => {
  setCurrentIndex(swiper.activeIndex);
  if (enableZoom) {
    setIsZoomed(false);
    const inst = zoomInstances[swiper.activeIndex];
    if (inst) requestAnimationFrame(() => inst.resetTransform());
  }
  if (onSlideChange) {
    onSlideChange(swiper.activeIndex);
  }
};


    const handlePrevSlide = () => {
        if (swiper) {
            swiper.slidePrev();
        }
    };

    const handleNextSlide = () => {
        if (swiper) {
            swiper.slideNext();
        }
    };

    const handleDragStart = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (isZoomChanging) return;

        setIsDragging(true);
        const absX = Math.abs(info.delta.x);
        const absY = Math.abs(info.delta.y);

        if (absY > absX) {
            setDragDirection('vertical');
        } else if (absX > absY) {
            setDragDirection('horizontal');
        }
    };

    const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (isZoomChanging || !isDragging) return;

        if (!dragDirection) {
            const absX = Math.abs(info.delta.x);
            const absY = Math.abs(info.delta.y);

            if (absY > absX && absY > 10) {
                setDragDirection('vertical');
            } else if (absX > absY && absX > 10) {
                setDragDirection('horizontal');
            }
        }
    };

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (isZoomChanging) return;

        setIsDragging(false);
        if (dragDirection === 'vertical' && (Math.abs(info.offset.y) > 100)) {
            onClose();
        } else {
            setShouldSnapBack(true);
            setTimeout(() => setShouldSnapBack(false), 300);
        }
        setDragDirection(null);
    };

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
        setIsZoomed(scale > 1);

        setTimeout(() => {
            setIsZoomChanging(false);
        }, 500);
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
    const onPointerDownCapture = (e: React.PointerEvent) => {
        startRef.current = { x: e.clientX, y: e.clientY };
        setDraggingV(false);
    };

    const onPointerMoveCapture = (e: React.PointerEvent) => {
        if (!startRef.current) return;
        if (isZoomed) return; // đang zoom thì không cho drag-to-close
        const dx = e.clientX - startRef.current.x;
        const dy = e.clientY - startRef.current.y;
        // ngưỡng & ưu tiên dọc
        if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx) * 1.2) {
            setDraggingV(true);
            // chỉ lúc này mới khởi động drag của Framer
            dragControls.start(e);
            startRef.current = null; // không cần theo dõi nữa
        }
    };

    const onPointerUpCapture = () => {
        startRef.current = null;
        setDraggingV(false);
    };
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
                    <div className="fixed inset-0 bg-black" />
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
                                    {showHeader && (
                                        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/50 to-transparent">
                                            <div className="flex items-center justify-between p-4 pt-12">
                                                <div className="flex items-center">
                                                    <button
                                                        onClick={onClose}
                                                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                                    >
                                                        <IoArrowBack className="text-white text-xl" />
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
                                                            <span className="text-white font-medium ml-2">
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
                                                        <button
                                                            onClick={handleDownload}
                                                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                                        >
                                                            <IoDownloadOutline className="text-white text-xl" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <motion.div
                                        className="w-full h-full relative"
                                        drag="y"
                                        dragControls={dragControls}
                                        dragListener={false}          // ✨ không tự bắt drag; sẽ bật bằng dragControls
                                        dragConstraints={{ top: -300, bottom: 300 }}
                                        dragElastic={{ top: 0.1, bottom: 0.1 }}
                                        dragMomentum={false}
                                        onDragEnd={(e, info) => {
                                            if (Math.abs(info.offset.y) > 100) onClose();
                                            else y.set(0);
                                            setDraggingV(false);
                                        }}
                                        style={{ y }}
                                        // ✨ phát hiện ý đồ kéo dọc trước khi bật drag
                                        onPointerDownCapture={onPointerDownCapture}
                                        onPointerMoveCapture={onPointerMoveCapture}
                                        onPointerUpCapture={onPointerUpCapture}
                                    >
                                        <motion.div
                                            className="absolute top-0 bottom-0 left-0 right-0 flex items-center justify-center"
                                            style={{ scale: motionScale, opacity, transition: 'all 0.2s ease' }}
                                        >
                                            <Swiper
                                            allowTouchMove={!draggingV && !isZoomed}
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
                                                {images.map((image, index) => (
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
                                                                            <img
                                                                                src={image}
                                                                                alt={`Image ${index + 1}`}
                                                                                className=" h-full object-contain"
                                                                                draggable={false}
                                                                                onClick={handleImageClick}
                                                                                style={{
                                                                                    touchAction: 'none',
                                                                                    userSelect: 'none',
                                                                                    pointerEvents: 'auto',
                                                                                    cursor: isZoomed ? 'zoom-out' : 'default'
                                                                                }}
                                                                            />
                                                                        </TransformComponent>
                                                                    </TransformWrapper>
                                                                </div>
                                                            ) : (
                                                                <img
                                                                    src={image}
                                                                    alt={`Image ${index + 1}`}
                                                                    className="max-w-full max-h-full object-contain"
                                                                    onClick={e => e.stopPropagation()}
                                                                    draggable={false}
                                                                    style={{
                                                                        userSelect: 'none',
                                                                        touchAction: 'manipulation'
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    </SwiperSlide>
                                                ))}
                                            </Swiper>
                                        </motion.div>
                                    </motion.div>
                                    {showNavButtons && images.length > 1 && (
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
                                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
                                        {enableZoom && isZoomed && zoomInstances[currentIndex] && (
                                            <div className="bg-black/60 text-white px-3 py-1 rounded-full text-sm mb-2">
                                                {Math.round(zoomInstances[currentIndex].state.scale * 100)}%
                                            </div>
                                        )}
                                        {showPageIndicator && images.length > 1 && (
                                            <div className="bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                                                {currentIndex + 1} / {images.length}
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