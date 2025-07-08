import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Native (Capacitor)
    if (Capacitor.isNativePlatform()) {
      import("@capacitor/network").then(({ Network }) => {
        Network.getStatus().then((status) => setIsOnline(status.connected));
        const handler = Network.addListener("networkStatusChange", (status) => {
          setIsOnline(status.connected);
        });
        unsubscribe = () => handler.remove();
      });
    } else {
      // Web
      const updateOnline = () => setIsOnline(navigator.onLine);
      window.addEventListener("online", updateOnline);
      window.addEventListener("offline", updateOnline);
      setIsOnline(navigator.onLine);
      unsubscribe = () => {
        window.removeEventListener("online", updateOnline);
        window.removeEventListener("offline", updateOnline);
      };
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return isOnline;
};

export default useNetworkStatus;
