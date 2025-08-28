import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { IoTrashOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import type { TranslationHistoryItem } from "@/types/translate-history";

interface HistoryItemProps {
    item: TranslationHistoryItem;
    onItemClick: (item: TranslationHistoryItem) => void;
    onDelete: (itemId: number) => void;
    onSwipeProgress?: (progress: number) => void;
    onSwipeEnd?: (item: TranslationHistoryItem) => void;
}
const WIDTH = 72;
const OPEN_SNAP_PROGRESS = 0.2;
const DELETE_PROGRESS = 0.7;
const VELOCITY_DELETE = -1000;
const SPRING = { type: "spring", stiffness: 500, damping: 40 };

const HistoryItem: React.FC<HistoryItemProps> = ({
    item,
    onItemClick,
    onDelete,
    onSwipeProgress,
    onSwipeEnd,
}) => {
    const { t } = useTranslation();

    const x = useMotionValue(0);
    const [open, setOpen] = useState(false);

    const rowRef = useRef<HTMLDivElement | null>(null);
    const rowWidthRef = useRef<number>(0);

    const lastOpenRawRef = useRef(0);
    const lastDeleteRawRef = useRef(0);

    useLayoutEffect(() => {
        const measure = () => {
            if (rowRef.current) rowWidthRef.current = rowRef.current.offsetWidth;
        };
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, []);

    const uiProgress = useTransform(x, (v) => {
        const openRaw = Math.max(0, -v / WIDTH);
        return Math.min(1, openRaw);
    });

    const redWidth = useTransform(x, (v) => `${Math.max(0, -v)}px`);
    const iconScale = useTransform(uiProgress, (p) => 0.9 + p * 0.35);
    const iconOpacity = useTransform(uiProgress, (p) => Math.min(1, p * 1.2));

    const iconX = useTransform(x, (v) => {
        const swipeDistance = Math.max(0, -v);
        if (swipeDistance <= WIDTH) {
            return 0;
        } else {
            const extraDistance = swipeDistance - WIDTH;
            return -extraDistance / 2;
        }
    });

    const iconWidth = useTransform(x, (v) => {
        const swipeDistance = Math.max(0, -v);
        return `${Math.max(WIDTH, swipeDistance)}px`;
    });

    useEffect(() => {
        const unsub = x.on("change", (v) => {
            const w = Math.max(1, rowWidthRef.current);
            const openRaw = Math.max(0, -v / WIDTH);
            const deleteRaw = Math.max(0, -v / w);

            lastOpenRawRef.current = openRaw;
            lastDeleteRawRef.current = deleteRaw;

            onSwipeProgress?.(Math.min(1, deleteRaw));
        });
        return unsub;
    }, [x, onSwipeProgress]);

    useEffect(() => {
        animate(x, open ? -WIDTH : 0, SPRING as any);
    }, [open, x]);

    const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        onSwipeEnd?.(item);

        const deleteRaw = lastDeleteRawRef.current;
        const openRaw = lastOpenRawRef.current;
        const fastSwipe = info?.velocity?.x != null && info.velocity.x <= VELOCITY_DELETE;

        if (deleteRaw >= DELETE_PROGRESS || fastSwipe) {
            const w = Math.max(WIDTH, rowWidthRef.current * 0.9);
            animate(x, -w, { duration: 0.12 });
            setTimeout(() => onDelete(item.id), 120);
            return;
        }

        if (openRaw >= OPEN_SNAP_PROGRESS) {
            setOpen(true);
            animate(x, -WIDTH as any, SPRING as any);
        } else {
            setOpen(false);
            animate(x, 0 as any, SPRING as any);
        }
    };

    const handleItemClick = () => {
        if (open) {
            setOpen(false);
            animate(x, 0 as any, SPRING as any);
        } else {
            onItemClick(item);
        }
    };

    const handlePressDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(item.id);
    };

    return (
        <div className="relative w-full select-none overflow-hidden">
            <motion.div
                className="absolute inset-y-0 right-0 bg-red-500"
                style={{ width: redWidth, pointerEvents: "none" }}
            />
            
            <motion.button
                aria-label={t("Delete") as string}
                onClick={handlePressDelete}
                className="absolute inset-y-0 right-0 w-[72px] flex items-center justify-center text-white z-10"
                style={{ 
                    scale: iconScale, 
                    opacity: iconOpacity,
                    x: iconX
                }}
            >
                <IoTrashOutline className="text-2xl" />
            </motion.button>

            {/* <motion.button
                aria-label={t("Delete") as string}
                onClick={handlePressDelete}
                className="absolute inset-y-0 right-0 flex items-center justify-center text-white z-10"
                style={{ 
                    scale: iconScale, 
                    opacity: iconOpacity,
                    width: iconWidth
                }}
            >
                <IoTrashOutline className="text-2xl" />
            </motion.button> */}

            <motion.div
                ref={rowRef}
                className="bg-white border-b-[0.5px] border-neutral-200 py-3 mx-6 w-auto relative z-20"
                style={{ x, touchAction: "pan-y" }}
                drag="x"
                dragDirectionLock
                dragElastic={0.12}
                onDragEnd={handleDragEnd}
                onPointerDown={(e) => ((e.currentTarget as HTMLElement).style.userSelect = "none")}
                onPointerUp={(e) => ((e.currentTarget as HTMLElement).style.userSelect = "")}
                onClick={handleItemClick}
                role="button"
                aria-label={open ? (t("Close") as string) : (t("Open actions") as string)}
            >
                <div
                    className="text-black truncate text-base line-clamp-2 break-all whitespace-normal"
                    style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {item.originalText}
                </div>
                <div
                    className="text-gray-600 text-base line-clamp-2 break-all whitespace-normal"
                    style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {item.translatedText || t("No translation available")}
                </div>
            </motion.div>
        </div>
    );
};

export default HistoryItem;
