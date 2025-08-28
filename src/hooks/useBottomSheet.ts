// src/hooks/useBottomSheet.ts
import React, { useRef, useState } from "react";
import {
    handleTouchStart as handleTouchStartUtil,
    handleTouchMove as handleTouchMoveUtil,
    handleTouchEnd as handleTouchEndUtil,
} from "@/utils/translate-utils";

const VELOCITY_THRESHOLD = 0.4;

export function useBottomSheet() {
    const [isOpen, setIsOpen] = useState(false);
    const [translateY, setTranslateY] = useState(0);

    const screenHeight = useRef<number>(typeof window !== "undefined" ? window.innerHeight : 0);
    const startY = useRef<number | null>(null);
    const startTime = useRef<number | null>(null);

    const open = () => {
        console.log("first")
        setIsOpen(true);
        setTranslateY(0);
    };

    const close = () => {
        setTranslateY(screenHeight.current);
        setTimeout(() => {
            setIsOpen(false);
            setTranslateY(0);
        }, 300);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        handleTouchStartUtil(e, startY, startTime);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        handleTouchMoveUtil(e, startY, screenHeight, setTranslateY);
    };

    const handleTouchEnd = () => {
        handleTouchEndUtil(
            translateY,
            startY,
            startTime,
            screenHeight,
            VELOCITY_THRESHOLD,
            close,
            setTranslateY
        );
    };

    return {
        isOpen,
        translateY,
        open,
        close,
        setTranslateY,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
    };
}
