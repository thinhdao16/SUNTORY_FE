import { HistoryGroup, TranslationHistoryItem } from "@/types/translate-history";
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
export function groupHistoryByDate(
  items: TranslationHistoryItem[],
  t: (key: string) => string,
  locale: string = ""
): HistoryGroup[] {
  const groups: HistoryGroup[] = [];
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  function isSameDay(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  }

  const sorted = [...items].sort((a, b) =>
    new Date(b.createDate).getTime() - new Date(a.createDate).getTime()
  );

  let currentLabel = "";
  let currentItems: TranslationHistoryItem[] = [];

  for (const item of sorted) {
    const date = new Date(item.createDate);
    let label = "";
    if (isSameDay(date, today)) {
      label = t("Today");
    } else if (isSameDay(date, yesterday)) {
      label = t("Yesterday");
    } else {
      label = date.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    }

    if (label !== currentLabel) {
      if (currentItems.length > 0) {
        groups.push({ label: currentLabel, items: currentItems });
      }
      currentLabel = label;
      currentItems = [];
    }
    currentItems.push(item);
  }

  if (currentItems.length > 0) {
    groups.push({ label: currentLabel, items: currentItems });
  }

  return groups;
}

export function getEmotionIcon(label: string, emotions: any[]): string {
  const emotion = emotions.find(e =>
    e.label.toLowerCase() === label.toLowerCase().trim() ||
    label.toLowerCase().includes(e.label.toLowerCase()) ||
    e.label.toLowerCase().includes(label.toLowerCase())
  );
  return emotion?.icon || "💭";
}