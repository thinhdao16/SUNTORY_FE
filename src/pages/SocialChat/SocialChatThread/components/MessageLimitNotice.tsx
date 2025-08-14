import React from "react";

type Props = {
    roomData: any;
    roomChatInfo: any;
    userInfo: any;
    isFriend: boolean;
    onSendFriend?: () => void;
};

const MessageLimitNotice: React.FC<Props> = ({ roomData, roomChatInfo, userInfo, isFriend, onSendFriend }) => {
    const otherParticipant = roomData?.participants?.find((p: any) => p.userId !== userInfo?.id);
    const otherName =
        (otherParticipant?.user?.firstname ? `${otherParticipant.user.firstname} ` : "") +
        (otherParticipant?.user?.lastname || "") ||
        otherParticipant?.user?.userName ||
        roomChatInfo?.title ||
        "Name";
    const awaitingAccept =
        !!roomData?.friendRequest &&
        roomData.friendRequest.fromUserId === (userInfo?.id ?? 0) &&
        !isFriend;
    return (
        <div className="my-3 flex justify-center">
            <div className="max-w-[680px] w-full px-4">
                <div className="rounded-full bg-netural-50 text-netural-500 text-sm px-5 py-3 flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex-1 leading-snug text-center break-words">
                        {t("chat.limitReached")}{" "}
                        {awaitingAccept ? (
                            <>
                                {t("chat.waitForAccept", { name: otherName })}
                            </>
                        ) : (
                            t("chat.sendFriendRequest")
                        )}
                    </div>



                    {!awaitingAccept && onSendFriend && (
                        <button
                            onClick={onSendFriend}
                            className="ml-2 shrink-0 rounded-full bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 hover:bg-blue-700 active:scale-[.98] transition"
                        >
                            Add friend
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageLimitNotice;
