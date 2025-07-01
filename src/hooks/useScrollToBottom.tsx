import { RefObject, useCallback } from "react";

export function useScrollToBottom<T extends HTMLElement = HTMLElement>(
    ref: RefObject<T | null>,
    delay = 100
) {
    return useCallback(() => {
        setTimeout(() => {
            ref.current?.scrollIntoView({ behavior: "smooth" });
        }, delay);
    }, [ref, delay]);
}