import React, { useMemo } from "react";
import avatarFallback from "@/icons/logo/social-chat/avt-rounded-full.svg";
import CongratulationFriend from "@/icons/logo/social-chat/congratulation-friend.svg";
import AcceptIcon from "@/icons/logo/social-chat/accept-friend.svg?react";
import RejectIcon from "@/icons/logo/social-chat/reject-friend.svg?react";
import { User } from "@/types/user";

export type FriendRequest = {
    type: "sent" | "received";
    senderName?: string;
    id: number;
    fromUserId: number;
};

export type Participant = {
    userId: number;
    name?: string;
    user?: {
        id: number;
        firstname?: string;
        lastname?: string;
        userName?: string;
        avatar?: string;
    };
    chatInfo?: {
        avatarRoomChat?: string;
    };
};

export type RoomData = {
    isFriend: boolean;
    friendRequest?: FriendRequest;
    title?: string;
    participants?: Participant[];
};

type Props = {
    roomData?: RoomData;
    currentUserId: number;
    onAcceptFriend: (id: number) => void;
    onRejectFriend: (id: number) => void;
    userInfo: User
};

const ChatRelationshipBanner: React.FC<Props> = ({
    roomData,
    currentUserId,
    onAcceptFriend,
    onRejectFriend,
    userInfo
}) => {
    if (!roomData) return null;

    const { isFriend, friendRequest, title } = roomData;
    const targetUser = roomData.participants?.find((p) => p.userId !== currentUserId);
    const targetAvatar =
        targetUser?.user?.avatar ||
        targetUser?.chatInfo?.avatarRoomChat ||
        avatarFallback;
    const senderName = useMemo(() => {
        if (!friendRequest) return undefined;
        if (friendRequest.senderName?.trim()) return friendRequest.senderName;
        const sender = roomData.participants?.find(
            (p) => p.userId === friendRequest.fromUserId
        );
        const fn = sender?.user?.firstname?.trim() || "";
        const ln = sender?.user?.lastname?.trim() || "";
        const full = [fn, ln].filter(Boolean).join(" ");
        return full || sender?.user?.userName || sender?.name || "User";
    }, [friendRequest, roomData.participants]);

    const isIncoming =
        !!friendRequest && friendRequest.fromUserId !== currentUserId && !isFriend;

    if (isIncoming) {
        return (
            <div className="my-4 flex justify-center sticky top-0 z-11">
                <div className="w-full max-w-md rounded-2xl bg-chat-to shadow-[0px_2px_4px_2px_#0000001A] ring-1 ring-blue-100 py-2 px-3">
                    <div className="flex items-center gap-2">
                        <img
                            src={targetAvatar}
                            alt={senderName || "Avatar"}
                            className="h-14 w-14 rounded-full object-cover shrink-0 bg-blue-100"
                            onError={(e) => (e.currentTarget.src = avatarFallback)}
                        />
                        <div className="grid gap-3 w-full">
                            <p className="text-[13px] text-gray-700 flex items-center">
                                <span className="font-semibold truncate max-w-[150px]">
                                    {senderName || t("Name")}
                                </span>
                                <span className="ml-1 flex-shrink-0">
                                    {t("has sent you a friend request")}
                                </span>
                            </p>
                            <div className="mt-2 flex gap-4 w-full">
                                <button
                                    onClick={() => friendRequest && onAcceptFriend(friendRequest.id)}
                                    disabled={!friendRequest}
                                    className="w-full  gap-1 rounded-lg bg-main px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 active:scale-[.98] transition disabled:opacity-60"
                                >
                                    {t("Accept")}
                                </button>
                                <button
                                    onClick={() => friendRequest && onRejectFriend(friendRequest.id)}
                                    disabled={!friendRequest}
                                    className="w-full  gap-1 rounded-lg bg-netural-50 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200 active:scale-[.98] transition disabled:opacity-60"
                                >
                                    {t("Decline")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // if (isFriend) {
    //     return (
    //         <div className="my-4 flex justify-center">
    //             <div className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white  shadow-[0px_2px_4px_2px_#0000001A] p-4">
    //                 <div className="pointer-events-none absolute h-[60px] top-0 inset-0 flex items-center justify-center opacity-60">
    //                     <img
    //                         src={CongratulationFriend}
    //                         alt="Congratulation"
    //                         className="w-full h-[60px] object-contain"
    //                     />
    //                 </div>

    //                 <div className="relative z-10 flex flex-col items-center gap-2 ">
    //                     <div className="flex items-center -space-x-2 ">
    //                         <img
    //                             src={targetAvatar}
    //                             alt="Friend Avatar"
    //                             className="h-[60px] w-[60px] rounded-full object-cover"
    //                             onError={(e) => (e.currentTarget.src = avatarFallback)}
    //                         />
    //                         <img
    //                             src={userInfo?.avatarLink || avatarFallback}
    //                             alt="My Avatar"
    //                             className="h-[60px] w-[60px] rounded-full object-cover border border-white"
    //                             onError={(e) => (e.currentTarget.src = avatarFallback)}
    //                         />
    //                     </div>
    //                     <p className="mt-2 font-semibold text-gray-800">
    //                         {t("friendship.nowFriends", { name: title || t("yourFriend") })}
    //                     </p>

    //                     <p className="text-sm text-neutral-500">{t("Send a hi to chat!")}</p>
    //                 </div>
    //             </div>
    //         </div>
    //     );
    // }


    return null;
};

export default ChatRelationshipBanner;
