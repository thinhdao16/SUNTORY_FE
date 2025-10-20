import { useEffect, useState } from "react";
import { Device } from "@capacitor/device";

interface DeviceInfo {
  deviceId: string | null;
  language: string | null;
}

const useDeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    deviceId: null,
    language: null,
  });

  useEffect(() => {
    const fetchDeviceInfo = async () => {
      try {
        const info = await Device.getId();
        const language = await Device.getLanguageCode();
        setDeviceInfo({
          deviceId: info.identifier,
          language: language.value,
        });
      } catch (error) {
        console.error("Error fetching device info:", error);
      }
    };

    fetchDeviceInfo();
  }, []);

  return deviceInfo;
};

export default useDeviceInfo;
