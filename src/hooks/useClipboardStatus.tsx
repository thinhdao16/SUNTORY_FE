import { useEffect, useState } from "react";
import { Clipboard } from "@capacitor/clipboard";

const useClipboardStatus = () => {
  const [clipboardHasData, setClipboardHasData] = useState(false);
  const [clipboardContent, setClipboardContent] = useState<string | null>(null);

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

    const handleClipboardChange = () => {
      checkClipboard();
    };

    document.addEventListener("copy", handleClipboardChange);
    document.addEventListener("cut", handleClipboardChange);

    return () => {
      document.removeEventListener("copy", handleClipboardChange);
      document.removeEventListener("cut", handleClipboardChange);
    };
  }, []);

  return { clipboardHasData, clipboardContent };
};

export default useClipboardStatus;
