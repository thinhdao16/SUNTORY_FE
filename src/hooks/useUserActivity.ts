import { useEffect, useRef } from "react";

interface ActivityHandler {
    touch: () => void;
    off: () => void;
    ready?: () => boolean;
}
interface UseUserActivityOptions {
    enabled?: boolean;
    onBeforeUnload?: () => void;
}

export function useUserActivity(
    activity: ActivityHandler,
    options: UseUserActivityOptions = {}
) {
    const { enabled = true, onBeforeUnload } = options;

    const actRef = useRef(activity);
    useEffect(() => { actRef.current = activity; }, [activity]);

    const lastFireAtRef = useRef(0);
    const debTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const MIN_GAP_MS = 30_000;
    const DEBOUNCE_MS = 400;

    const fireTouch = () => {
        const a = actRef.current;
        if (a.ready && !a.ready()) return;
        const now = Date.now();
        if (now - lastFireAtRef.current < MIN_GAP_MS) return; 
        lastFireAtRef.current = now;
        a.touch();
    };

    const scheduleTouch = () => {
        if (debTimerRef.current) clearTimeout(debTimerRef.current);
        debTimerRef.current = setTimeout(fireTouch, DEBOUNCE_MS);
    };

    useEffect(() => {
        if (!enabled) return;

        const onFocus = scheduleTouch;
        const onKey = scheduleTouch;
        const onPointerDown = scheduleTouch; 
        const onClick = scheduleTouch;
        const onVisibility = () => {
            if (document.visibilityState === "visible") scheduleTouch();
            else actRef.current.off();
        };
        const onBeforeUnloadHandler = () => {
            actRef.current.off();
            onBeforeUnload?.();
        };

        window.addEventListener("focus", onFocus);
        window.addEventListener("keydown", onKey, { passive: true } as any);
        window.addEventListener("pointerdown", onPointerDown, { passive: true } as any);
        window.addEventListener("click", onClick, { passive: true } as any);
        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("beforeunload", onBeforeUnloadHandler);

        fireTouch();

        return () => {
            if (debTimerRef.current) clearTimeout(debTimerRef.current);
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("pointerdown", onPointerDown);
            window.removeEventListener("click", onClick);
            window.removeEventListener("beforeunload", onBeforeUnloadHandler);
            actRef.current.off();
        };
    }, [enabled, onBeforeUnload]);
}
