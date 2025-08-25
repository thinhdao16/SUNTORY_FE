import { uploadChatFile } from "@/services/file/file-service";
import { useImageStore } from "@/store/zustand/image-store";
import { Capacitor } from "@capacitor/core";
import { useIonToast } from "@ionic/react";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import CameraIcon from "@/icons/logo/chat/cam.svg?react";
import { useParams } from "react-router";

const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

const CameraWeb: React.FC = () => {
    const { roomId } = useParams<{ roomId?: string }>();

    const inputRef = useRef<HTMLInputElement>(null);
    const [present, dismiss] = useIonToast();
    const { t } = useTranslation();
    const addPendingImages = useImageStore((s) => s.addPendingImages);
    const pendingImages = useImageStore((s) => s.pendingImages);
    const removePendingImageByUrl = useImageStore((s) => s.removePendingImageByUrl);
    const isImageLimitExceeded = () => pendingImages.length >= 2;

    const handleUploadImageFile = async (file: File) => {
        const localUrl = URL.createObjectURL(file);

        addPendingImages([localUrl]);
        try {
            if (file.size > MAX_IMAGE_SIZE) {
                present({
                    message: t("Photo must be less than 20MB!"),
                    duration: 3000,
                    color: "danger",
                });
                removePendingImageByUrl(localUrl);
                URL.revokeObjectURL(localUrl);
                return;
            }
            const uploaded = await uploadChatFile(file);
            removePendingImageByUrl(localUrl);
            URL.revokeObjectURL(localUrl);
            if (uploaded?.length) {
                addPendingImages([uploaded[0].linkImage]);
                // history.goBack();
            }
        } catch {
            removePendingImageByUrl(localUrl);
            URL.revokeObjectURL(localUrl);
            present({
                message: t("Image upload failed!"),
                duration: 3000,
                color: "danger",
            });
        }
    };
    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (isImageLimitExceeded()) {
            present({
                message: t("You can only send up to 2 images!"),
                duration: 2000,
                color: "warning",
            });
            e.target.value = "";
            return;
        }
        await handleUploadImageFile(file);
        e.target.value = "";
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={handleChange}
            />

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
            >
                <CameraIcon aria-label={t("camera")} />
            </button>
        </>
    );
};

export default CameraWeb;