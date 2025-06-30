import React from "react";

export const handleTouchStart = (
  e: React.TouchEvent,
  startY: React.MutableRefObject<number | null>,
  startTime: React.MutableRefObject<number | null>
) => {
  startY.current = e.touches[0].clientY;
  startTime.current = Date.now();
};

export const handleTouchMove = (
  e: React.TouchEvent,
  startY: React.MutableRefObject<number | null>,
  screenHeight: React.MutableRefObject<number>,
  setTranslateY: React.Dispatch<React.SetStateAction<number>>
) => {
  if (startY.current !== null) {
    const currentY = e.touches[0].clientY;
    const delta = currentY - startY.current;

    if (delta > 0 && delta < screenHeight.current * 0.8) {
      setTranslateY(delta);
    }
  }
};

export const handleTouchEnd = (
  translateY: number,
  startY: React.MutableRefObject<number | null>,
  startTime: React.MutableRefObject<number | null>,
  screenHeight: React.MutableRefObject<number>,
  velocityThreshold: number,
  closeModal: () => void,
  setTranslateY: React.Dispatch<React.SetStateAction<number>>
) => {
  if (startY.current !== null && startTime.current !== null) {
    const deltaY = translateY;
    const deltaTime = Date.now() - startTime.current;
    const velocity = deltaY / deltaTime;
    if (velocity > velocityThreshold) {
      closeModal();
    } else if (deltaY > screenHeight.current / 1.6) {
      closeModal();
    } else {
      setTranslateY(0);
    }
  }
  startY.current = null;
  startTime.current = null;
};

export const handleResize = (
  initialHeight: number,
  setIsKeyboardVisible: React.Dispatch<React.SetStateAction<boolean>>,
  setHeightKeyBoard: React.Dispatch<React.SetStateAction<number>>
) => {
  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  const isKeyboardOpen = viewportHeight < window.innerHeight;
  setIsKeyboardVisible(isKeyboardOpen);
  if (isKeyboardOpen) {
    const keyboardHeight = initialHeight - viewportHeight;
    setHeightKeyBoard(keyboardHeight);
  }
};
