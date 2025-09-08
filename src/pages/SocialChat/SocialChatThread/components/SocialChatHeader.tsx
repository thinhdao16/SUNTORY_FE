import React, { useEffect, useRef, useState } from "react";
import BackIcon from "@/icons/logo/back-default.svg?react";
import { t } from "i18next";
import avatarFallback from "@/icons/logo/social-chat/avt-rounded-full.svg";
import AddFriendMainIcon from "@/icons/logo/social-chat/add-friend-main.svg?react";
import CancelInnovationIcon from "@/icons/logo/social-chat/cancel-innovation.svg?react";
import UnFriendIcon from "@/icons/logo/social-chat/unfriend.svg?react";
import MoreActionIcon from "@/icons/logo/social-chat/more-action.svg?react";
import ConfirmModal from "@/components/common/modals/ConfirmModal";
import { ChatInfoType } from "@/constants/socialChat";
import { useHistory } from "react-router";
import  InfoIcon from "@/icons/logo/info.svg?react";
const MoreDots: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
    <button
        {...props}
        className={`px-2 py-1 rounded hover:bg-gray-100 ${props.className || ""}`}
        aria-label="More options"
    >
        <MoreActionIcon />
    </button>
);

export type FriendRequest = {
    type: "sent" | "received";
    senderName?: string;
    id: number;
    fromUserId: number;
};

export type RoomData = {
    isFriend: boolean;
    friendRequest?: FriendRequest;
    title?: string;
    participants?: { userId: number; name?: string }[];
    isRequestSender: boolean;
};

interface SocialChatHeaderProps {
    onBackClick: () => void;
    roomChatInfo?: { avatarRoomChat?: string; title?: string; type?: number } | null;
    roomData?: RoomData;
    onSendFriendRequest: (targetUserId: number) => void;
    onCancelFriendRequest: (requestId: number) => void;
    onUnfriend: (targetUserId: number) => void;
    currentUserId: number;
    roomId?: string
}

const SocialChatHeader: React.FC<SocialChatHeaderProps> = ({
    onBackClick,
    roomChatInfo,
    roomData,
    onSendFriendRequest,
    onCancelFriendRequest,
    onUnfriend,
    currentUserId,
    roomId
}) => {
    const history = useHistory()
    const src = roomChatInfo?.avatarRoomChat?.trim() ? roomChatInfo.avatarRoomChat : avatarFallback;
    const isFriend = !!roomData?.isFriend;
    const friendRequest = roomData?.friendRequest;
    const targetParticipant = roomData?.participants?.find((p) => p.userId !== currentUserId);

    const [openMenu, setOpenMenu] = useState(false);
    const [confirmState, setConfirmState] = useState<{ open: boolean; type: "cancel" | "unfriend" | null }>({
        open: false,
        type: null,
    });

    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(e.target as Node)) setOpenMenu(false);
        };
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpenMenu(false);
        };
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onEsc);
        };
    }, []);

    const openConfirmModal = (type: "cancel" | "unfriend") => {
        setConfirmState({ open: false, type: null });
        requestAnimationFrame(() => {
            setConfirmState({ open: true, type });
        });
    };

    let RightActions: React.ReactNode = null;

    if (isFriend) {
        RightActions = (
            <div className="relative z-50" ref={menuRef}>
                <MoreDots onClick={() => setOpenMenu((v) => !v)} />
                {openMenu && (
                    <div
                        className="absolute right-0 mt-2 w-36 overflow-hidden rounded-xl bg-white shadow-lg z-50"
                        role="menu"
                    >
                        <button
                            onClick={() => {
                                setOpenMenu(false);
                                openConfirmModal("unfriend");
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error-400 font-semibold hover:bg-red-50"
                            role="menuitem"
                        >
                            <UnFriendIcon /> {t("Unfriend")}
                        </button>
                    </div>
                )}
            </div>
        );
    } else {
        if (friendRequest && friendRequest.fromUserId === currentUserId) {
            RightActions = (
                <button
                    onClick={() => openConfirmModal("cancel")}
                    className="disabled:opacity-60"
                    title="Cancel friend request"
                >
                    <CancelInnovationIcon className="w-6 h-6" />
                </button>
            );
        } else if (!friendRequest) {
            RightActions = (
                <button
                    onClick={() => targetParticipant && onSendFriendRequest(targetParticipant.userId)}
                    disabled={!targetParticipant}
                    className="disabled:opacity-60"
                    title="Add friend"
                >
                    <AddFriendMainIcon className="w-6 h-6" />
                </button>
            );
        }
    }

    return (
        <>
            <div className="w-full sticky top-0 z-20">
                <div className="relative flex items-center justify-between px-4 sm:px-6 h-[50px]">
                    <div className="flex items-center gap-3 z-10">
                        <button onClick={onBackClick} aria-label="Back" className="p-1 rounded hover:bg-gray-100">
                            <BackIcon />
                        </button>
                        <div className="flex items-center gap-2">
                            <img
                                src={src}
                                alt={roomChatInfo?.title || "Avatar"}
                                className="w-[34px] h-[34px] rounded-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = avatarFallback;
                                }}
                            />
                            <span className="text-sm font-semibold text-gray-800">
                                {roomChatInfo?.title || roomData?.title || "Chat Room"}
                            </span>
                        </div>
                    </div>
                    {roomChatInfo?.type === ChatInfoType.UserVsUser && <div className="z-10">{RightActions}</div>}
                {roomChatInfo?.type === ChatInfoType.Group && <div className="z-10">
                    <button
                        onClick={() => history.push(`/social-chat/t/${roomId}/info`)}
                    >
                        <InfoIcon className="w-5 h-5" />
                    </button>   
                </div>}
            </div>
            </div>
            <ConfirmModal
                isOpen={confirmState.open}
                title={t("Are you sure?")}
                message={confirmState.type === "cancel" ? t("You can always send another request later!") : t("You will no longer see their updates or share yours with them")}
                confirmText={confirmState.type === "cancel" ? t("Yes, cancel") : t("Yes, unfriend")}
                cancelText={t("Cancel")}
                onConfirm={() => {
                    if (confirmState.type === "cancel" && friendRequest) {
                        onCancelFriendRequest(friendRequest.id);
                    }
                    if (confirmState.type === "unfriend" && targetParticipant) {
                        onUnfriend(targetParticipant.userId);
                    }
                    setConfirmState({ open: false, type: confirmState.type });
                }}
                onClose={() => setConfirmState({ open: false, type: confirmState.type })}
            />
        </>
    );
};

export default SocialChatHeader;
