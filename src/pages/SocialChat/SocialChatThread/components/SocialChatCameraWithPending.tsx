import React, { useCallback, useRef } from 'react';
import CameraIcon from "@/icons/logo/chat/cam.svg?react";
import { t } from "@/lib/globalT";

interface SocialChatCameraWithPendingProps {
    onCameraResult?: (file: File) => void;
    disabled?: boolean;
}

const SocialChatCameraWithPending: React.FC<SocialChatCameraWithPendingProps> = ({
    onCameraResult,
    disabled = false
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) {
            e.target.value = "";
            return;
        }

        const mediaFiles = files.filter(file => 
            file.type.startsWith('image/') || file.type.startsWith('video/')
        );
        
        if (mediaFiles.length > 0) {
            mediaFiles.forEach(file => {
                onCameraResult?.(file);
            });
        }
        
        e.target.value = "";
    }, [onCameraResult]);

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

export default SocialChatCameraWithPending;
