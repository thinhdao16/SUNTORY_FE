/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";

export function useScrollButton(messagesContainerRef: any) {
    const [showScrollButton, setShowScrollButton] = useState(false);

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
            setShowScrollButton(!isAtBottom);
        }
    };

    useEffect(() => {
        const container = messagesContainerRef.current;
        container?.addEventListener("scroll", handleScroll);
        return () => {
            container?.removeEventListener("scroll", handleScroll);
        };
    }, [messagesContainerRef]);

    return { showScrollButton, handleScroll };
}