import { useToastStore } from "@/store/zustand/toast-store";

export const handleCopyToClipboard = (e: string) => {
  const showToast = useToastStore.getState().showToast;

  if (!e) {
    showToast(t("No content to copy!"), 3000);
    return;
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(e)
      .then(() => {
        showToast(t("Copied to clipboard!"));
      })
      .catch((err) => {
        showToast(t("Copy error!"), 3000);
        console.error(t("Copy error!"), err);
      });
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = e;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      const successful = document.execCommand("copy");
      if (successful) {
        showToast(t("Copied to clipboard!"));
      } else {
        showToast(t("Copy error!"), 3000);
      }
    } catch (err) {
      showToast(t("Copy error!"), 3000);
      console.error(t("Copy error!"), err);
    }

    document.body.removeChild(textarea);
  }
};
