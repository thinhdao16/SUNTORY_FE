import { useEffect, useState } from "react";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { Capacitor } from "@capacitor/core";

export function useKeyboardResize() {
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [keyboardResizeScreen, setKeyboardResizeScreen] = useState(false);

    useEffect(() => {
        if (Capacitor.getPlatform() === "android") {
            Keyboard.setResizeMode({ mode: KeyboardResize.Body });
        } else {
            Keyboard.setResizeMode({ mode: KeyboardResize.None });
        }

        const onKeyboardShow = (event: any) => {
            setKeyboardHeight(event.keyboardHeight || 0);
        };

        const onKeyboardHide = () => {
            setKeyboardHeight(0);
        };

        Keyboard.addListener("keyboardWillShow", onKeyboardShow);
        Keyboard.addListener("keyboardDidShow", onKeyboardShow);
        Keyboard.addListener("keyboardWillHide", onKeyboardHide);
        Keyboard.addListener("keyboardDidHide", onKeyboardHide);
        return () => {
            Keyboard.removeAllListeners();
        };
    }, []);

    useEffect(() => {
        let lastHeight = window.visualViewport?.height || window.innerHeight;
        const handleResize = () => {
            const currentHeight = window.visualViewport?.height || window.innerHeight;
            if (lastHeight - currentHeight > 100) {
                setKeyboardResizeScreen(true);
            } else if (currentHeight - lastHeight > 100) {
                setKeyboardResizeScreen(false);
            }
            lastHeight = currentHeight;
        };
        window.visualViewport?.addEventListener("resize", handleResize);
        window.addEventListener("resize", handleResize);

        setTimeout(() => {
            const initialHeight = window.visualViewport?.height || window.innerHeight;
            const fullHeight = window.innerHeight;
            if (fullHeight - initialHeight > 100) {
                setKeyboardResizeScreen(true);
                setKeyboardHeight(fullHeight - initialHeight);
            } else {
                setKeyboardResizeScreen(false);
                setKeyboardHeight(0);
            }
        }, 100);

        return () => {
            window.visualViewport?.removeEventListener("resize", handleResize);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return { keyboardHeight, keyboardResizeScreen };
}
