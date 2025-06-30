import React, { useRef, useState } from "react";
import CameraIcon from "@/icons/logo/chat/cam.svg?react";
import { motion, AnimatePresence } from "framer-motion";
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
                if (data?.linkImage) {
                    onAvatarUploaded?.(data.linkImage);
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
                </div>
                <div className="mt-3 text-xl font-bold">{userInfo?.name}</div>
                <div className="text-gray-400 text-sm">{userInfo?.email}</div>
            </div>
            <AnimatePresence>
                {showPreview && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowPreview(false)}
                    >
                        <motion.img
                            src={userInfo?.avatarLink || "/favicon.png"}
                            alt="Avatar Preview"
                            className="max-w-[200px] max-h-[80vh]"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
