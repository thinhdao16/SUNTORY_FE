import React, { useEffect, useMemo, useState } from "react";
import { useParams, useHistory } from "react-router-dom";

import { useSocialChatStore } from "@/store/zustand/social-chat-store";
import { useAuthStore } from "@/store/zustand/auth-store";
import { useToastStore } from "@/store/zustand/toast-store";

import { IoPersonAddOutline } from "react-icons/io5";
import { MdOutlineEdit, MdOutlineGroups, MdOutlinePhotoLibrary } from "react-icons/md";
import { FaCamera } from "react-icons/fa";
import { BiTrash } from "react-icons/bi";
import { TbLogout } from "react-icons/tb";

import BackDefaultIcon from "@/icons/logo/back-default.svg?react";
import NextIcon from "@/icons/logo/next.svg?react";
import NextGrayIcon from "@/icons/logo/vector-right-gray.svg?react";
import MuteIcon from "@/icons/logo/social-chat/mute.svg?react"
import UnMuteIcon from "@/icons/logo/social-chat/unmute.svg?react"
import AddMemberIcon from "@/icons/logo/social-chat/add-member.svg?react"
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg";
import avatarGroupFallback from "@/icons/logo/social-chat/avt-gr-rounded.svg";

import EditGroupNameModal from "./components/EditGroupNameModal";
import ConfirmModal from "@/components/common/modals/ConfirmModal";
import { useToggleQuietStatus } from "../hooks/useSocialChat";

import {
    useChatRoomByCode,
    useGetChatRoomAttachments,
    useUpdateChatRoom,
    useLeaveChatRoom,
    useRemoveChatRoom,
} from "../hooks/useSocialChat";

import { uploadChatFile } from "@/services/file/file-service";
import { t } from "@/lib/globalT";
import { useSocialSignalR } from "@/hooks/useSocialSignalR";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useUserActivity } from "@/hooks/useUserActivity";
import { ChatInfoType } from "@/constants/socialChat";

interface SocialChatInfoProps { }

const SocialChatInfo: React.FC<SocialChatInfoProps> = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const history = useHistory();

    const { roomChatInfo, deleteRoom } = useSocialChatStore();
    const { user } = useAuthStore.getState();
    const showToast = useToastStore((s) => s.showToast);

    const { data: roomData, refetch: refetchRoomData } = useChatRoomByCode(roomId ?? "");
    const { data: attachmentsPages, isLoading: isAttachmentsLoading } = useGetChatRoomAttachments(roomId, 4, {
        enabled: !!roomId,
    });

    const updateChatRoomMutation = useUpdateChatRoom();
    const isUpdating = updateChatRoomMutation.isLoading;

    const { mutateAsync: leaveRoom, isLoading: isLeaving } = useLeaveChatRoom({
        onSuccess: () => {
            deleteRoom(roomId ?? "");
            history.push("/social-chat");
        },
    });
    const deviceInfo: { deviceId: string | null, language: string | null } = useDeviceInfo();
    const toggleQuietMutation = useToggleQuietStatus();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isQuietConfirmOpen, setIsQuietConfirmOpen] = useState(false);
    const { mutateAsync: removeChatRoom, isLoading: isDeleting } = useRemoveChatRoom({
        onSuccess: () => {
            deleteRoom(roomId ?? "");
            history.push("/social-chat");
        },
    });
    const {activity} = useSocialSignalR(deviceInfo.deviceId ?? "", {
        roomId: roomId ?? "",
        refetchRoomData,
        autoConnect: true,
        enableDebugLogs: false,
        onTypingUsers: (payload) => {
        }
    });
    useUserActivity(activity, { enabled: !!roomId });

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const isAdmin = useMemo(() => {
        if (!user || !roomChatInfo?.participants) return false;
        const p = roomChatInfo.participants.find((x) => x.userId === user.id);
        return p?.isAdmin === 1;
    }, [user, roomChatInfo]);

    const allAttachments = useMemo(() => {
        if (!attachmentsPages || !attachmentsPages.pages) return [];
        return attachmentsPages.pages.flatMap((p: any) => p?.data?.data || []);
    }, [attachmentsPages]);

    const mediaPreview = useMemo(() => {
        const imageFiles = allAttachments.filter((file: any) => {
            const ext = file.fileName?.toLowerCase().split(".").pop();
            return ext && ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
        });
        return imageFiles.slice(0, 4);
    }, [allAttachments]);

    const avatarUrl = (roomChatInfo?.avatarRoomChat || '').trim();
    const isGroup = (roomChatInfo?.type === ChatInfoType.Group) || (roomData?.type === ChatInfoType.Group);
    const displaySrc = avatarPreview || (avatarUrl || (isGroup ? avatarGroupFallback : avatarFallback));

    const handleBack = () => history.push(`/social-chat/t/${roomId}`);

    const handleUpdateGroupName = async (newName: string) => {
        if (!roomId) return;
        try {
            await updateChatRoomMutation.mutateAsync({ chatCode: roomId, title: newName });
        } catch (err) {
            console.error("Failed to update group name:", err);
        }
    };

    const handleAvatarUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !roomId) return;

        const localPreviewUrl = URL.createObjectURL(file);
        setAvatarPreview(localPreviewUrl);
        setIsUploadingAvatar(true);

        try {
            const uploaded = await uploadChatFile(file);
            if (uploaded?.length && uploaded[0].linkImage) {
                const imageUrl = uploaded[0].linkImage;
                await updateChatRoomMutation.mutateAsync({ chatCode: roomId, avatarRoomChat: imageUrl });
                showToast(t("Cập nhật ảnh đại diện thành công"), 2000, "success");
            } else {
                throw new Error("Upload returned no url");
            }
        } catch (err) {
            console.error("Failed to update group avatar:", err);
            showToast(t("Không thể cập nhật ảnh đại diện"), 3000, "error");
            setAvatarPreview(null);
        } finally {
            setIsUploadingAvatar(false);
            URL.revokeObjectURL(localPreviewUrl);
        }
    };

    const handleLeaveGroup = async () => {
        if (!roomId) return;
        try {
            await leaveRoom({ chatCode: roomId });
        } catch (err) {
            console.error("Leave group failed", err);
        }
    };

    const handleDeleteGroup = async () => {
        if (!roomId) return;
        try {
            await removeChatRoom({ chatCode: roomId });
        } catch (err) {
            console.error("Remove group failed", err);
        }
    };

    const currentParticipant: any = roomChatInfo?.participants?.find((p: any) => p.userId === user?.id);
    const currentIsQuiet = (currentParticipant?.isQuiet === 1) || (currentParticipant?.isQuiet === true);

    const handleToggleQuietConfirmed = async () => {
        if (!roomId) return;
        try {
            setIsQuietConfirmOpen(false);
            await toggleQuietMutation.mutateAsync({ chatCode: roomId, isQuiet: !currentIsQuiet });
        } catch (err) {
            console.error("Toggle quiet status failed", err);
        }
    };

    useEffect(() => {
        setAvatarPreview(null);
    }, [roomChatInfo?.code]);

    return (
        <div className="h-screen flex flex-col bg-[#F0F3F9] overflow-y-auto">
            <div className="sticky top-0 z-10 px-4 py-3 flex items-center">
                <button onClick={handleBack} className="p-1">
                    <BackDefaultIcon />
                </button>
                <span className="font-semibold text-base ml-2">{t("Thông tin đoạn chat")}</span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6">
                <div className="rounded-xl p-4 mt-2 flex flex-col items-center">
                    <div className="relative mb-3">
                        <div className="rounded-lg overflow-hidden">
                            <img
                                src={displaySrc}
                                alt={roomChatInfo?.title || "Avatar"}
                                className={`object-cover w-24 h-24 ${isUploadingAvatar || isUpdating ? "opacity-50" : ""}`}
                                onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = avatarFallback;
                                    if (avatarPreview) setAvatarPreview(null);
                                }}
                            />
                            {(isUploadingAvatar || isUpdating) && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>

                        {isAdmin && (
                            <div className="absolute bottom-0 right-[-10px] bg-white rounded-full p-1 border border-gray-200">
                                <label htmlFor="avatar-upload" className="cursor-pointer">
                                    <FaCamera className="text-gray-600" />
                                    <input id="avatar-upload" className="hidden" type="file" accept="image/*" onChange={handleAvatarUpdate} />
                                </label>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-medium">{roomData?.title || "Supernova"}</h2>
                        {isAdmin && (<button className="text-gray-500" onClick={() => setIsEditModalOpen(true)}>
                            <MdOutlineEdit />
                        </button>
                        )}</div>

                    <div className="flex items-center gap-8 mt-4">
                        {isAdmin && (
                            <button className="flex flex-col items-center gap-1" onClick={() => history.push(`/social-chat/t/${roomId}/add-members`)}>
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                                    <AddMemberIcon />
                                </div>
                                <span className="text-xs text-gray-600">{t("Thêm")}</span>
                            </button>
                        )}

                        <button
                            className="flex flex-col items-center gap-1"
                            onClick={() => setIsQuietConfirmOpen(true)}
                        >
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                                {currentIsQuiet ? (
                                    <MuteIcon />
                                ) : (
                                    <UnMuteIcon />
                                )}
                            </div>
                            <span className="text-xs text-gray-600">{currentIsQuiet ? t("Unmute") : t("Mute")}</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-3xl mt-4 p-4">
                    <h3 className="text-sm text-netural-300">{t("Thông tin đoạn chat")}</h3>

                    <button className="w-full flex items-center justify-between pt-4" onClick={() => history.push(`/social-chat/t/${roomId}/members`)}>
                        <div className="flex items-center gap-3">
                            <MdOutlineGroups className="text-gray-500 text-xl" />
                            <span>{t("Xem thành viên")}</span> ({roomData?.participants?.length || 0})
                        </div>
                        <NextGrayIcon className="text-gray-400" />
                    </button>
                </div>

                <div className="bg-white rounded-3xl mt-4">
                    <div className="border-b border-gray-100">
                        <h3 className="px-4 py-3 text-sm text-gray-500">{t("Hành động khác")}</h3>

                        <button className="w-full flex flex-col px-4 py-3">
                            <div className="flex items-center justify-between" onClick={() => history.push(`/social-chat/t/${roomId}/view-attachments`)}>
                                <div className="flex items-center gap-3">
                                    <MdOutlinePhotoLibrary className="text-gray-500 text-xl" />
                                    <span>{t("Xem phương tiện đã chia sẻ")}</span>
                                </div>
                                <NextGrayIcon className="text-gray-400" />
                            </div>

                            <div className="mt-3">
                                {isAttachmentsLoading ? (
                                    [...Array(4)].map((_, i) => (
                                        <div key={i} className="w-16 h-16 rounded-md overflow-hidden bg-gray-200 animate-pulse" />
                                    ))
                                ) : mediaPreview.length === 0 ? (
                                    <div className="text-sm text-left text-gray-500">{t("Chưa có phương tiện được chia sẻ")}</div>
                                ) : (
                                    <div className="grid grid-cols-5 gap-2">
                                        {mediaPreview.map((media: any) => (
                                            <div key={media.id} className="w-full aspect-square rounded-md overflow-hidden border border-netural-50" onClick={() => history.push(`/social-chat/t/${roomId}/view-attachments`)}>
                                                <img
                                                    src={media.fileUrl}
                                                    alt={`Media ${media.id}`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => ((e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=Error")}
                                                />
                                            </div>
                                        ))}

                                        <button className="flex items-center justify-center w-full aspect-square rounded-md bg-primary-50 text-blue-500" onClick={() => history.push(`/social-chat/t/${roomId}/view-attachments`)}>
                                            <NextIcon className="text-xl" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </button>
                    </div>

                    {isAdmin && (
                        <button
                            className="w-full flex items-center gap-3 px-4 py-4 text-red-500"
                            onClick={() => setIsDeleteConfirmOpen(true)}
                            disabled={isDeleting}
                        >
                            <BiTrash className="text-xl" />
                            <span>{isDeleting ? t("Deleting...") : "Xóa nhóm"}</span>
                        </button>
                    )}

                    <button className="w-full flex items-center gap-3 px-4 py-4 text-red-500 border-t border-gray-100" onClick={() => setIsConfirmOpen(true)} disabled={isLeaving}>
                        <TbLogout className="text-xl" />
                        <span>{isLeaving ? t("Leaving...") : "Rời nhóm"}</span>
                    </button>
                </div>
            </div>

            <EditGroupNameModal isOpen={isEditModalOpen} initialName={roomData?.title || "WayJet"} onClose={() => setIsEditModalOpen(false)} onSave={handleUpdateGroupName} />

            <ConfirmModal
                isOpen={isQuietConfirmOpen}
                title={currentIsQuiet ? t("Turn on notifications?") : t("Turn off notifications?")}
                message={currentIsQuiet ? t("Do you want to turn on notifications for this chat?") : t("Do you want to mute notifications for this chat?")}
                confirmText={currentIsQuiet ? t("Turn on") : t("Mute")}
                cancelText={t("Cancel")}
                onConfirm={() => {
                    void handleToggleQuietConfirmed();
                }}
                onClose={() => setIsQuietConfirmOpen(false)}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                title={t("Are you sure?")}
                message={t("Are you sure you want to leave this group?")}
                confirmText={t("Leave")}
                cancelText={t("Cancel")}
                onConfirm={() => {
                    setIsConfirmOpen(false);
                    void handleLeaveGroup();
                }}
                onClose={() => setIsConfirmOpen(false)}
            />

            <ConfirmModal
                isOpen={isDeleteConfirmOpen}
                title={t("Delete group?")}
                message={t("This will permanently delete the group. Are you sure?")}
                confirmText={t("Delete")}
                cancelText={t("Cancel")}
                onConfirm={() => {
                    setIsDeleteConfirmOpen(false);
                    void handleDeleteGroup();
                }}
                onClose={() => setIsDeleteConfirmOpen(false)}
            />
        </div>
    );
};

export default SocialChatInfo;