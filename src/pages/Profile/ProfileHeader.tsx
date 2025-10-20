import React, { useRef, useState } from "react";
import CameraIcon from "@/icons/logo/chat/cam.svg?react";
import AvatarPreviewModal from "@/components/common/AvatarPreviewModal";
import { useUploadAvatar } from "./hooks/useProfile";

interface UserInfo {
    avatarLink?: string;
    name?: string;
    email?: string;
}

interface ProfileHeaderProps {
    userInfo: UserInfo;
    onAvatarClick?: () => void;
    onCameraClick?: () => void;
}

export const ProfileHeader = ({
    userInfo,
    onAvatarClick,
    onCameraClick,
    onAvatarUploaded,
    refetchAuthInfo, // truyền từ cha xuống
}: ProfileHeaderProps & { onAvatarUploaded?: (url: string) => void, refetchAuthInfo?: () => void }) => {
    const [showPreview, setShowPreview] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadAvatarMutation = useUploadAvatar();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadAvatarMutation.mutate(file, {
            onSuccess: (data) => {
                if (data) {
                    refetchAuthInfo?.();
                }
            },
        });
    };

    return (
        <>
            <div className="flex flex-col items-center mt-18 mb-2">
                <div className="relative w-24 h-24">
                    <img
                        src={userInfo?.avatarLink || "/favicon.png"}
                        alt={userInfo?.name}
                        className="w-full h-full rounded-full object-cover border-2 border-gray-200 cursor-pointer"
                        onClick={() => setShowPreview(true)}
                    />
                    <button
                        className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white flex items-center justify-center border-2 border-white shadow cursor-pointer"
                        style={{ transform: "translate(25%, 25%)" }}
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                    >
                        <CameraIcon className="w-5 h-5 text-white" />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    {uploadAvatarMutation.isLoading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full z-10">
                            <div className="loader border-4 border-white border-t-main rounded-full w-10 h-10 animate-spin"></div>
                        </div>
                    )}
                </div>
                <div className="mt-3 text-xl font-bold">{userInfo?.name}</div>
                <div className="text-gray-400 text-sm">{userInfo?.email}</div>
            </div>
            <AvatarPreviewModal
                open={showPreview}
                src={userInfo?.avatarLink || "/favicon.png"}
                alt="Avatar Preview"
                onClose={() => setShowPreview(false)}
            />
        </>
    );
};
