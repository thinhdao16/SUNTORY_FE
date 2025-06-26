import React, { useEffect } from "react";

export function useAutoResizeTextarea(ref: React.RefObject<HTMLTextAreaElement>, value: string) {
    useEffect(() => {
        const textarea = ref.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
        }
    }, [ref, value]);
}