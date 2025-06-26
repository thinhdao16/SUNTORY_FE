import { IonContent, IonIcon, IonPage } from "@ionic/react";
import "./Scanner.module.css";
import { useState } from "react";
import { flashlightOutline } from "ionicons/icons";
import { CameraPreview } from "capacitor-plugin-camera";
import CrossPlatformQRCodeScanner from "@/components/common/CrossPlatformQRCodeScanner";

const Scanner = () => {
  const [torchOn, setTorchOn] = useState(false);
  const [viewBox, setViewBox] = useState("0 0 720 1280");


  // useEffect(() => {
  //   ionBackground.current = document.documentElement.style.getPropertyValue(
  //     "--ion-background-color"
  //   );
  //   sessionStorage.setItem("check_scan", "no");
  //   return () => {
  //     document.documentElement.style.setProperty(
  //       "--ion-background-color",
  //       ionBackground.current
  //     );
  //     scanned.current = false;
  //   };
  // }, []);

  const toggleFlashlight = async () => {
    try {
      setTorchOn((prev) => !prev);
      await CameraPreview.toggleTorch({ on: !torchOn });
    } catch (error) {
      console.error("Error toggling flashlight:", error);
    }
  };

  const onPlayed = (result: { orientation: string; resolution: string }) => {
    const [width, height] = result.resolution
      .split("x")
      .map((val) => parseInt(val));
    const box =
      result.orientation === "PORTRAIT"
        ? `0 0 ${height} ${width}`
        : `0 0 ${width} ${height}`;
    setViewBox(box);
    console.log(viewBox)
  };


  return (
    <IonPage>
      <IonContent fullscreen className="relative h-full p-0 m-0">
        <div className="absolute top-8 z-50 flex justify-between w-full px-4 text-white">
          <div></div>
          <div className="font-semibold text-center">{t("Scan to Rate")}</div>
          <div>
            <IonIcon
              icon={flashlightOutline}
              className={`cursor-pointer ${torchOn ? "text-yellow-400" : ""}`}
              onClick={toggleFlashlight}
            />
          </div>
        </div>
        <CrossPlatformQRCodeScanner
          torchOn={torchOn}
          onPlayed={onPlayed}
        // onScanned={onScanned}
        />
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <label
            htmlFor="upload-image"
            className="bg-white text-black px-4 py-2 rounded-3xl cursor-pointer font-medium"
          >
            {t("Upload an image")}
          </label>
          <input
            id="upload-image"
            type="file"
            accept="image/*"
            className="hidden"
          // onChange={handleImageUpload}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Scanner;
