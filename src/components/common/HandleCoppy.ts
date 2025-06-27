import { useToastStore } from "@/store/zustand/toast-store";
import { Clipboard } from "@capacitor/clipboard";


export const handleCopyToClipboard = async (e: string) => {
  const showToast = useToastStore.getState().showToast;
  if (!e) {
    showToast("No content to copy!", 1000);
    return;
  }

  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(e);
      showToast("Copied to clipboard!");
      return;
    } catch { }
  }

  try {
    await Clipboard.write({ string: e });
    showToast("Copied to clipboard!");
    return;
  } catch { }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = e;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    setTimeout(() => {
      document.body.removeChild(textarea);
    }, 0);
    showToast("Copied to clipboard!");
  } catch (err) {
    showToast("Copy error!", 1000);
    console.error("Copy error!", err);
  }
};