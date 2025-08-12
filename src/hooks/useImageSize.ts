import { useEffect, useState } from "react";

export function useImageSize(src?: string | null) {
    const [size, setSize] = useState<{ width: number; height: number } | null>(null);

    useEffect(() => {
        if (!src) {
            setSize(null);
            return;
        }

        let isMounted = true;
        const img = new Image();
        img.decoding = "async";
        img.loading = "eager"; 
        img.src = src;
        img.onload = () => {
            if (!isMounted) return;
            if (img.naturalWidth && img.naturalHeight) {
                setSize({ width: img.naturalWidth, height: img.naturalHeight });
            } else {
                setSize(null);
            }
        };
        img.onerror = () => {
            if (!isMounted) return;
            setSize(null);
        };

        return () => {
            isMounted = false;
        };
    }, [src]);

    return size;
}
