import React from "react";
import { SystemMessageType } from "@/constants/socialChat";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/zustand/auth-store";
import CongratulationGroup from "@/icons/logo/social-chat/congratulation-group.svg";
import CongratulationFriend from "@/icons/logo/social-chat/congratulation-friend.svg";
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg";

interface ChatSystemMessageProps {
    type: number;
    data: any;
    isCollapsed?: boolean;
    onExpand?: () => void;
    roomData: any;
    isLatestFriendlyAccepted?: boolean;
}

const ChatSystemMessage: React.FC<ChatSystemMessageProps> = ({
    type,
    data,
    isCollapsed = false,
    onExpand,
    roomData,
    isLatestFriendlyAccepted = false
}) => {
    if (!roomData) return null;
    const { user } = useAuthStore();

    const { title } = roomData;
    const targetUser = roomData?.participants?.find((p: any) => p.userId !== user?.id);
    const targetAvatar =
        targetUser?.user?.avatar ||
        targetUser?.chatInfo?.avatarRoomChat ||
        avatarFallback;
    const { t } = useTranslation();
    const formatUser = (u: any) => {
        if (!u) return "Unknown";
        const userId = u.Id || u.id || u.UserId;
        const name = u.FullName || u.fullName || u.UserName || u.name || "User";
        if (userId === user?.id) {
            return "You";
        }
        return (
            <Link
                to={`/social-partner/profile/${userId}`}
                className=""
            >
                {name}
            </Link>
        );
    };
    const renderNotificationContent = () => {
        const actor = data.actor || data.Actor;
        const target = data.target || (data.targetUser || (data.targetUsers?.[0] ?? data.targetUsers)) || (data.Users?.[0] ?? data.Users);
        const targetUsers = data.targetUsers || data.Users || [];

        switch (type) {
            case SystemMessageType.NOTIFY_GROUP_CHAT_CREATED:
                return (
                    <div className="relative p-4 my-2 bg-white shadow-lg rounded-xl text-center text-base font-medium text-netural-500 overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none z-0">
                            <img
                                src={CongratulationGroup}
                                alt=""
                                aria-hidden="true"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className="relative z-10">
                            {formatUser(actor)} {t("has created the group!")}
                        </span>
                    </div>
                );

            case SystemMessageType.NOTIFY_GROUP_CHAT_KICKED:
                return (
                    <>{formatUser(actor)} {t("has removed")} {formatUser(target)} {t("from group")}.</>
                );

            case SystemMessageType.NOTIFY_GROUP_CHAT_ADD_MEMBER:
                if (targetUsers.length > 0) {
                    if (isCollapsed) {
                        return (
                            <div>
                                {formatUser(actor)} {t("has added")} {formatUser(targetUsers[0])}.
                                {targetUsers.length > 1 && (
                                    <button
                                        onClick={onExpand}
                                        className="text-blue-500 hover:underline ml-2"
                                    >
                                        {t("See more")}
                                    </button>
                                )}
                            </div>
                        );
                    } else {
                        return (
                            <div className="space-y-1">
                                {targetUsers.map((user: any, index: number) => (
                                    <div key={index}>
                                        {formatUser(actor)} {t("has added")} {formatUser(user)}.
                                    </div>
                                ))}
                            </div>
                        );
                    }
                }
                return (
                    <>{formatUser(actor)} {t("has added")} {formatUser(target)}.</>
                );

            case SystemMessageType.NOTIFY_GROUP_CHAT_USER_LEAVE_GROUP:
                return (
                    <>{formatUser(actor)} {t("has left the group")}.</>
                );

            case SystemMessageType.NOTIFY_GROUP_CHAT_ADMIN_RENAME_GROUP:
                return (
                    <>{formatUser(actor)} {t("has renamed the group")}.</>
                );

            case SystemMessageType.NOTIFY_GROUP_CHAT_ADMIN_CHANGE_AVATAR_GROUP:
                return (
                    <>{formatUser(actor)} {t("has changed the group avatar")}.</>
                );

            case SystemMessageType.NOTIFY_GROUP_CHAT_ADMIN_LEAVE_GROUP:
                return (
                    <>{formatUser(actor)} {t("has left the group as admin")}.</>
                );

            case SystemMessageType.NOTIFY_GROUP_CHAT_CHANGE_ADMIN:
                return (
                    <>{formatUser(actor)} {t("has appointed")} {formatUser(target)} {t("as group admin")}.</>
                );

            case SystemMessageType.NOTIFY_FRIENDLY_ACCEPTED:
                if (isLatestFriendlyAccepted) {
                    return (
                        <div className="my-4 flex justify-center">
                        <div className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white  shadow-[0px_2px_4px_2px_#0000001A] p-4">
                            <div className="pointer-events-none absolute h-[60px] top-0 inset-0 flex items-center justify-center opacity-60">
                                <img
                                    src={CongratulationFriend}
                                    alt="Congratulation"
                                    className="w-full h-[60px] object-contain"
                                />
                            </div>
        
                            <div className="relative z-10 flex flex-col items-center gap-2 ">
                                <div className="flex items-center -space-x-2 ">
                                    <img
                                        src={targetAvatar}
                                        alt="Friend Avatar"
                                        className="h-[60px] w-[60px] rounded-full object-cover"
                                        onError={(e) => (e.currentTarget.src = avatarFallback)}
                                    />
                                    <img
                                        src={user?.avatarLink || avatarFallback}
                                        alt="My Avatar"
                                        className="h-[60px] w-[60px] rounded-full object-cover border border-white"
                                        onError={(e) => (e.currentTarget.src = avatarFallback)}
                                    />
                                </div>
                                <p className="mt-2 font-semibold text-gray-800">
                                    {t("friendship.nowFriends", { name: title || t("yourFriend") })}
                                </p>
        
                                <p className="text-sm text-neutral-500">{t("Send a hi to chat!")}</p>
                            </div>
                        </div>
                    </div>
                    );
                } else {
                    return (
                        null
                    );
                }

            default:
                return (
                    <>{t("System notification")}.</>
                );
        }
    };

    return (
        <div className={`${SystemMessageType.NOTIFY_GROUP_CHAT_CREATED != type && type !== SystemMessageType.NOTIFY_FRIENDLY_ACCEPTED ? "p-4 my-2 bg-netural-50 rounded-xl text-center text-sm text-neutral-500" : ""}`}>
            {renderNotificationContent()}
        </div>
    );
};

export default ChatSystemMessage;