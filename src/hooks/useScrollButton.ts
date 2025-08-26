import React, { useEffect, useRef, useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";

type AnyRef = React.RefObject<HTMLElement>;

interface ScrollButtonConfig {
    threshold?: number;
    enableVisualFeedback?: boolean;
}

export function useScrollButton(
    containerRef: AnyRef, 
    bottomRef?: AnyRef, 
    config: ScrollButtonConfig = {}
) {
    const { threshold = 200, enableVisualFeedback = false } = config;
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [distanceFromBottom, setDistanceFromBottom] = useState(0); 

    const forceFallback = Capacitor.isNativePlatform();
    const ioSupported =
        typeof window !== "undefined" &&
        "IntersectionObserver" in window &&
        !forceFallback;

    const rafId = useRef<number | null>(null);

    const compute = useCallback(() => {
        const c = containerRef.current;
        if (!c) return;
        const { scrollTop, clientHeight, scrollHeight } = c;
        
        const currentPosition = Math.ceil(scrollTop + clientHeight);
        const totalHeight = scrollHeight;
        const distance = Math.max(0, totalHeight - currentPosition);
        
        const showButton = distance > threshold;
        
        setShowScrollButton(showButton);
        
        // ✅ Optional: Track distance for visual feedback
        if (enableVisualFeedback) {
            setDistanceFromBottom(distance);
        }
    }, [containerRef, threshold, enableVisualFeedback]);

    const recalc = useCallback(() => {
        if (rafId.current) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(compute);
    }, [compute]);

    const onContainerScroll = useCallback(() => {
        recalc();
    }, [recalc]);

    useEffect(() => {
        const c = containerRef.current;
        const b = bottomRef?.current;
        if (!c) return;

        (c.style as any).WebkitOverflowScrolling = "touch";

        requestAnimationFrame(() => requestAnimationFrame(recalc));

        if (!ioSupported || !b) {
            c.addEventListener("scroll", onContainerScroll, { passive: true });

            const ro = new ResizeObserver(() => recalc());
            ro.observe(c);

            return () => {
                c.removeEventListener("scroll", onContainerScroll);
                ro.disconnect();
                if (rafId.current) cancelAnimationFrame(rafId.current);
            };
        }

        const io = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                // ✅ For IntersectionObserver, use custom logic
                if (!entry.isIntersecting) {
                    // Element is not visible, show button
                    setShowScrollButton(true);
                } else {
                    // Element is visible, check if it's close to bottom
                    const rect = entry.boundingClientRect;
                    const rootRect = entry.rootBounds;
                    if (rootRect) {
                        const distanceFromViewportBottom = rootRect.bottom - rect.bottom;
                        setShowScrollButton(distanceFromViewportBottom > threshold);
                    }
                }
            },
            {
                root: c,
                threshold: 0,
                rootMargin: `0px 0px -${threshold}px 0px`, // ✅ Adjust root margin
            }
        );

        setTimeout(() => {
            const r = b.getBoundingClientRect();
            const rr = c.getBoundingClientRect();
            const distanceFromContainerBottom = rr.bottom - r.bottom;
            setShowScrollButton(distanceFromContainerBottom > threshold);
        }, 0);

        io.observe(b);

        const ro = new ResizeObserver(() => {
            recalc();
        });
        ro.observe(c);

        return () => {
            io.disconnect();
            ro.disconnect();
        };
    }, [containerRef, bottomRef, ioSupported, onContainerScroll, recalc, threshold]);

    return { 
        showScrollButton, 
        onContainerScroll: ioSupported ? undefined : onContainerScroll, 
        recalc, 
        setShowScrollButton,
        distanceFromBottom // ✅ Return distance for debugging/feedback
    };
}
