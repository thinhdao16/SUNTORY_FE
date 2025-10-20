import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Portal({ id = "chat-overlay-root", children }: { id?: string; children: React.ReactNode }) {
    const [el, setEl] = useState<HTMLElement | null>(null);
    useEffect(() => {
        let root = document.getElementById(id) as HTMLElement | null;
        if (!root) {
            root = document.createElement("div");
            root.id = id;
            document.body.appendChild(root);
        }
        root.style.position = "relative";
        root.style.zIndex = "9999";
        root.style.pointerEvents = "none";
        root.style.paddingTop = "env(safe-area-inset-top)";
        root.style.paddingBottom = "env(safe-area-inset-bottom)";
        setEl(root);
    }, [id]);
    if (!el) return null;
    return createPortal(children, el);
}
