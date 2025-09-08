import React from "react";
import { SystemMessageType } from "@/constants/socialChat";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/zustand/auth-store";
import CongratulationGroup from "@/icons/logo/social-chat/congratulation-group.svg";

interface ChatSystemMessageProps {
    type: number;
    data: any;
    isCollapsed?: boolean;
    onExpand?: () => void;
    dataRoom: any
}

const ChatSystemMessage: React.FC<ChatSystemMessageProps> = ({
    type,
    data,
    isCollapsed = false,
    onExpand,
    dataRoom
}) => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
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
                return (
                    <>{formatUser(actor)} {t("and")} {formatUser(target)} {t("are now friends")}.</>
                );
                
            default:
                return (
                    <>{t("System notification")}.</>
                );
        }
    };

    return (
        <div className={`${SystemMessageType.NOTIFY_GROUP_CHAT_CREATED !=type ? "p-4 my-2 bg-netural-50 rounded-xl text-center text-sm text-neutral-500" : ""}`}>
            {renderNotificationContent()}
        </div>
    );
};

export default ChatSystemMessage;