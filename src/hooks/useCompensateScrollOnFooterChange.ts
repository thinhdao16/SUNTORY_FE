// useCompensateScrollOnFooterChange.ts
import { MutableRefObject, useEffect, useRef } from "react";

type Opts = {
    stickToBottomThreshold?: number; // nếu đang gần đáy -> dính đáy thay vì bù trừ
    clampDelta?: number;             // giới hạn delta để tránh nhảy mạnh (px)
};

export function useCompensateScrollOnFooterChange(
    containerRef: MutableRefObject<HTMLElement | null>,
    footerHeight: number,
    opts: Opts = {}
) {
    const { stickToBottomThreshold = 16, clampDelta = 800 } = opts;
    const prevHeightRef = useRef(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        let delta = footerHeight - prevHeightRef.current;
        if (delta === 0) return;

        // Giới hạn delta để tránh giật do đo sai/nhảy layout lớn
        if (Math.abs(delta) > clampDelta) {
            delta = Math.sign(delta) * clampDelta;
        }

        const nearBottom =
            el.scrollHeight - (el.scrollTop + el.clientHeight) <= stickToBottomThreshold;

        const apply = () => {
            if (nearBottom) {
                // Nếu đang sát đáy: dính đáy cho mượt
                el.scrollTop = el.scrollHeight;
            } else {
                // Không sát đáy: bù trừ scroll đúng bằng delta
                el.scrollTop += delta;
            }
            prevHeightRef.current = footerHeight;
        };

        rafRef.current = requestAnimationFrame(apply);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [containerRef, footerHeight, stickToBottomThreshold, clampDelta]);
}
