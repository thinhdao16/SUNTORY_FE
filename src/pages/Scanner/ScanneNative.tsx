import {
    IonButton,
    IonContent,
    IonPage,
} from "@ionic/react";
import "./ScannerNative.css";
import React, { useEffect, useRef, useState } from "react";
import {
    CapacitorBarcodeScanner,
    CapacitorBarcodeScannerAndroidScanningLibrary,
    CapacitorBarcodeScannerCameraDirection,
    CapacitorBarcodeScannerScanOrientation,
    CapacitorBarcodeScannerTypeHint,
} from "@capacitor/barcode-scanner";
import { useHistory } from "react-router";

const ScannerNative: React.FC = () => {
    const [scannerResult, setScannerResult] = useState("No Data...");
    const isScanningRef = useRef(false);
    const history = useHistory();

    const scanBarcode = async () => {
        if (isScanningRef.current) return;
        isScanningRef.current = true;

        try {
            const result = await CapacitorBarcodeScanner.scanBarcode({
                hint: CapacitorBarcodeScannerTypeHint.ALL,
                scanInstructions: "Scan to Rate",
                scanButton: false,
                cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
                scanOrientation: CapacitorBarcodeScannerScanOrientation.ADAPTIVE,
                android: {
                    scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.ZXING,
                },
            });

            if (!result.ScanResult) {
                setTimeout(() => {
                    isScanningRef.current = false;
                    scanBarcode();
                }, 1000);
                return;
            }

            setScannerResult(result.ScanResult);

            try {
                const url = new URL(result.ScanResult);
                history.push(url.pathname);
            } catch (e) {
                console.warn("Invalid URL scanned");
                setTimeout(() => {
                    isScanningRef.current = false;
                    scanBarcode();
                }, 2000);
            }

        } catch (error) {
            console.error("Scan error", error);
            setScannerResult("Error: " + (error instanceof Error ? error.message : "Unknown error"));
            setTimeout(() => {
                isScanningRef.current = false;
                scanBarcode();
            }, 2000);
        }
    };



    useEffect(() => {
        scanBarcode();
    }, []);

    return (
        <IonPage>
            <IonContent fullscreen>

            </IonContent>
        </IonPage>
    );
};

export default ScannerNative;
