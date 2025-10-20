import { useState, useEffect } from "react";

const useKeyboardManager = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [heightKeyBoard, setHeightKeyBoard] = useState(0);

  useEffect(() => {
    const initialHeight = window.innerHeight;
    const handleResize = () => {
      const viewportHeight =
        window.visualViewport?.height || window.innerHeight;
      const isKeyboardOpen = viewportHeight < window.innerHeight;
      setIsKeyboardVisible(isKeyboardOpen);
      if (isKeyboardOpen) {
        const keyboardHeight = initialHeight - viewportHeight;
        setHeightKeyBoard(keyboardHeight);
      }
    };
    window.visualViewport?.addEventListener("resize", handleResize);
    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  return {
    isKeyboardVisible,
    heightKeyBoard,
    setIsKeyboardVisible,
    setHeightKeyBoard,
  };
};

export default useKeyboardManager;
