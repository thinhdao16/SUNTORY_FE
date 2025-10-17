import { useEffect } from "react";
import { SafeArea } from "capacitor-plugin-safe-area";

const useSafeArea = () => {
  useEffect(() => {
    SafeArea.getSafeAreaInsets().then(({ insets }) => {
      for (const [key, value] of Object.entries(insets)) {
        document.documentElement.style.setProperty(
          `--safe-area-inset-${key}`,
          `${value}px`
        );

        console.log("SafeArea Insets:", insets);
      }
    });

    SafeArea.getStatusBarHeight().then(({ statusBarHeight }) => {
      document.documentElement.style.setProperty(
        "--status-bar-height",
        `${statusBarHeight}px`
      );
    });

    let removeListener: () => void;

    SafeArea.addListener("safeAreaChanged", ({ insets }) => {
      for (const [key, value] of Object.entries(insets)) {
        document.documentElement.style.setProperty(
          `--safe-area-inset-${key}`,
          `${value}px`
        );
      }
    }).then((listener) => {
      removeListener = listener.remove;
    });

    return () => {
      if (removeListener) removeListener();
    };
  }, []);
};

export default useSafeArea;
