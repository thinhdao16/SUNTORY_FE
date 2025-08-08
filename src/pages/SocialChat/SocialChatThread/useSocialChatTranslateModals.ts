import {
    handleTouchStart as handleTouchStartUtil,
    handleTouchMove as handleTouchMoveUtil,
    handleTouchEnd as handleTouchEndUtil,
} from "@/utils/translate-utils";
import React from "react";

const velocityThreshold = 0.4;

export const useSocialChatModals = (
    screenHeight: React.RefObject<number>,
    startY: React.RefObject<number | null>,
    startTime: React.RefObject<number | null>,
    setIsOpenTranslateInput: (open: boolean) => void,
    setTranslateY: React.Dispatch<React.SetStateAction<number>>,
    translateY: number
) => {
    const openModalTranslate = () => {
        setIsOpenTranslateInput(true);
        setTranslateY(0);
    };

    const closeModalTranslate = () => {
        setTranslateY(screenHeight.current);
        setTimeout(() => {
            setIsOpenTranslateInput(false);
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
            velocityThreshold,
            closeModalTranslate,
            setTranslateY
        );
    };

    return {
        openModalTranslate,
        closeModalTranslate,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd
    };
};