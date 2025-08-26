import React, { use, useEffect, useRef } from "react";
import { PiImageBold } from "react-icons/pi";
import { IoIosClose } from "react-icons/io";
import { useScannerStore } from "@/store/zustand/scanner-store";
import useCameraPermission from "@/hooks/useCameraPermission";

const TakePhoto = () => {
    const { photos, addPhotos, removePhoto } = useScannerStore();
    const { hasPermission, requestPermission } = useCameraPermission();

    const fileInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (hasPermission === false) {
            requestPermission();
        }
    }
        , [hasPermission, requestPermission]);
    const downloadPhoto = (file: File) => {
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name || `photo_${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    const handleSelectPhotos = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const filesArray = Array.from(event.target.files);
            const filesURLs = filesArray.map((file) => URL.createObjectURL(file));
            addPhotos(filesURLs);
            const now = Date.now();
            filesArray.forEach((file) => {
                const diff = now - file.lastModified;
                if (diff < 7000) {
                    downloadPhoto(file);
                }
            });
        }
    };

    const handleButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };



    return (
        <>
            <div className="grid grid-cols-3 gap-4 mt-4">
                {photos.map((photo, idx) => (
                    <div key={idx} className="relative ">
                        <img
                            src={photo}
                            className="w-full aspect-square object-cover rounded-2xl"
                        />
                        <button
                            onClick={() => removePhoto(idx)}
                            className="absolute top-2 right-2 bg-black/20 text-white rounded-full p-0.5 shadow-lg transition-opacity hover:bg-black/70"
                        >
                            <IoIosClose size={16} />
                        </button>
                    </div>
                ))}
            </div>
            <button
                className="flex items-center justify-center w-full bg-zinc-200 darkk:bg-dark-extra p-3 rounded-3xl font-semibold gap-2 mt-4"
                onClick={handleButtonClick}
            >
                <PiImageBold size={24} /> {t(`Upload images`)}
            </button>
            <input
                ref={fileInputRef}
                id="selectPhotos"
                type="file"
                accept="image/*"
                multiple
                // capture="environment"
                style={{ display: "none" }}
                onChange={handleSelectPhotos}
            />
        </>
    );
};

export default TakePhoto;