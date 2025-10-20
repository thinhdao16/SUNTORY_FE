import { useEffect, useState } from "react";
import { Clipboard } from "@capacitor/clipboard";

const useClipboardStatus = () => {
  const [clipboardHasData, setClipboardHasData] = useState(false);
  const [clipboardContent, setClipboardContent] = useState<string | null>(null);
  const [reloadCoppy, setReloadCopy] = useState(false);
  const toggleReloadCopy = () => setReloadCopy(!reloadCoppy);
  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const { value } = await Clipboard.read();
        setClipboardHasData(!!value);
        setClipboardContent(value || null);
      } catch (err) {
        console.error("Không thể đọc clipboard:", err);
        setClipboardHasData(false);
        setClipboardContent(null);
      }
    };
    checkClipboard();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkClipboard();
      }
    };

    const handleFocus = () => {
      checkClipboard();
    };

    const handleClipboardChange = () => {
      checkClipboard();
    };

    document.addEventListener("copy", handleClipboardChange);
    document.addEventListener("cut", handleClipboardChange);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("copy", handleClipboardChange);
      document.removeEventListener("cut", handleClipboardChange);
    };
  }, [reloadCoppy]);


  return { clipboardHasData, clipboardContent, toggleReloadCopy };
};

export default useClipboardStatus;
