import React, { useCallback, useEffect, useLayoutEffect, useRef } from "react";

type Opts = {
    containerRef: React.RefObject<HTMLElement>;
    bottomRef?: React.RefObject<HTMLElement>;
    headerHeight?: number;
    footerHeight?: number;
    extraOffset?: number;
    itemsLength?: number;
    stickToBottomOnChange?: boolean;
    fixedFooter?: boolean;
};

export function useScrollByHeights({
    containerRef,
    bottomRef,
    headerHeight = 0,
    footerHeight = 0,
    extraOffset = 0,
    itemsLength,
    stickToBottomOnChange = true,
    fixedFooter = true,
}: Opts) {
    const scrollToHeight = useCallback(() => {
        const c = containerRef.current;
        if (!c) return;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (bottomRef?.current) {
                    bottomRef.current.scrollIntoView({ block: "end" });
                } else {
                    c.scrollTop = c.scrollHeight;
                }
            });
        });
    }, [containerRef, bottomRef]);

    useLayoutEffect(() => {
        const c = containerRef.current as HTMLElement | null;
        if (!c) return;

        c.style.minHeight = "0";

        if (fixedFooter) {
            c.style.height = "auto";
            c.style.maxHeight = "none";
            c.style.paddingBottom = `${footerHeight}px`;
        } else {
            const h = Math.max(0, headerHeight + footerHeight + extraOffset);
            c.style.height = `calc(100dvh - ${h}px)`;
            c.style.paddingBottom = "0px";
        }
    }, [containerRef, headerHeight, footerHeight, extraOffset, fixedFooter]);

    useEffect(() => {
        if (!stickToBottomOnChange) return;
        scrollToHeight();
    }, [itemsLength, stickToBottomOnChange, scrollToHeight]);
    return { scrollToHeight };
}
