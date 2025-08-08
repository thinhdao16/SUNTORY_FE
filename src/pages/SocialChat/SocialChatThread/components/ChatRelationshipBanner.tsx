import React from "react";
import AddFriendIcon from "@/icons/logo/social-chat/add-friend.svg?react";
import CancelInnovationIcon from "@/icons/logo/social-chat/cancel-innovation.svg?react";
import AcceptFriendIcon from "@/icons/logo/social-chat/accept-friend.svg?react";
import RejectFriendIcon from "@/icons/logo/social-chat/reject-friend.svg?react";
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
    participants?: { userId: number; name: string }[];
    isRequestSender: boolean;
};

interface Props {
    roomData?: RoomData;
    onAcceptFriend: (id: number) => void;
    onRejectFriend: (id: number) => void;
    onSendFriendRequest: (id: number) => void;
    onCancelFriendRequest: (id: number) => void;
    currentUserId: number;
}

const ChatRelationshipBanner: React.FC<Props> = ({
    roomData,
    onAcceptFriend,
    onRejectFriend,
    onSendFriendRequest,
    onCancelFriendRequest,
    currentUserId
}) => {
    if (!roomData) return null;
    const { isFriend, friendRequest, title } = roomData;
    const targetParticipant: { userId: number; name: string } | undefined = roomData.participants?.find(
        (p: any) => p.userId !== currentUserId
    );
    if (!isFriend) {
        if (friendRequest && friendRequest?.fromUserId === currentUserId && isFriend === false) {
            return (
                <div className="text-center my-4">
                    <button
                        onClick={() => friendRequest && onCancelFriendRequest(friendRequest.id)}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full flex items-center gap-2"
                    >
                        <CancelInnovationIcon className="w-4 h-4" />
                        Cancel Request
                    </button>
                </div>
            );
        }
        if (friendRequest &&friendRequest?.fromUserId !== currentUserId && isFriend === false) {
            return (
                <div className="text-center my-4 space-y-2">
                    <p>{friendRequest?.senderName || "User"} has sent you a friend request</p>
                    <div className="flex justify-center gap-3">
                        <button
                            onClick={() => friendRequest && onAcceptFriend(friendRequest.id)}
                            className="px-3 py-1 bg-blue-500 text-white rounded flex items-center gap-1"
                            disabled={!friendRequest}
                        >
                            <AcceptFriendIcon className="w-4 h-4" />
                            Accept
                        </button>
                        <button
                            onClick={() => friendRequest && onRejectFriend(friendRequest.id)}
                            className="px-3 py-1 border rounded flex items-center gap-1"
                            disabled={!friendRequest}
                        > 
                            <RejectFriendIcon className="w-4 h-4" />
                            Reject
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="text-center my-4">
                <button
                    onClick={() => targetParticipant && onSendFriendRequest(targetParticipant.userId)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-full shadow flex items-center gap-2"
                    disabled={!targetParticipant}
                >
                    <AddFriendIcon className="w-4 h-4" />
                    Add Friend
                </button>
            </div>
        );
    }
    return (
        <div className="flex items-center justify-center my-4">
            <div className="bg-gray-100 px-4 py-2 rounded-xl text-center text-sm text-gray-600">
                🎉 You and {title} are now friends!<br />
                Send a hi to chat!
            </div>
        </div>
    );
};

export default ChatRelationshipBanner;
