import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import CameraIcon from "@/icons/logo/chat/cam.svg?react";

const SocialStoryCameraWeb: React.FC = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();
    const { storyId } = useParams<{ storyId?: string }>();

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Handle story image upload
            console.log('Story image selected:', file);
        }
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

export default SocialStoryCameraWeb;
