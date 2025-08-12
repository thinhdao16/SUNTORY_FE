// useScrollButton.ts
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";

type AnyRef = React.RefObject<HTMLElement>;

export function useScrollButton(containerRef: AnyRef, bottomRef?: AnyRef) {
    const [showScrollButton, setShowScrollButton] = useState(false);

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
        const atBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 2;
        setShowScrollButton(!atBottom);
    }, [containerRef]);

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
                setShowScrollButton(!entry.isIntersecting);
            },
            {
                root: c,
                threshold: 0,
                rootMargin: "0px 0px -1px 0px",
            }
        );

        setTimeout(() => {
            const r = b.getBoundingClientRect();
            const rr = c.getBoundingClientRect();
            const fullyVisible = r.bottom <= rr.bottom && r.top >= rr.top;
            setShowScrollButton(!fullyVisible);
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
    }, [containerRef, bottomRef, ioSupported, onContainerScroll, recalc]);

    return { showScrollButton, onContainerScroll: ioSupported ? undefined : onContainerScroll, recalc, setShowScrollButton };
}
