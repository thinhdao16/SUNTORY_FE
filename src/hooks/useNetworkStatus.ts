import { useState, useEffect } from "react";

const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  const checkInternetConnection = async () => {
    try {
      await fetch("https://www.google.com/favicon.ico", {
        method: "HEAD",
        mode: "no-cors",
      });
      setIsOnline(true);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setIsOnline(false);
    }
  };

  useEffect(() => {
    checkInternetConnection();

    const handleOnline = () => checkInternetConnection();
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
};

export default useNetworkStatus;
