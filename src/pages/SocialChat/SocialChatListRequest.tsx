import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { BsPerson } from 'react-icons/bs';
import { useHistory } from 'react-router';
import { useAcceptFriendRequest, useFriendshipReceivedRequests, useRejectFriendRequest } from '../SocialPartner/hooks/useSocialPartner';
import AcceptFriendIcon from "@/icons/logo/social-chat/accept-friend.svg?react";
import RejectFriendIcon from "@/icons/logo/social-chat/reject-friend.svg?react";
import { useToastStore } from '@/store/zustand/toast-store';
import { useSocialChatStore } from '@/store/zustand/social-chat-store';
import { createAnonymousChatRoom } from '@/services/social/social-chat-service';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg";
import { useSocialSignalR } from '@/hooks/useSocialSignalR';
import useDeviceInfo from '@/hooks/useDeviceInfo';

function SocialChatListRequest() {
    const history = useHistory();
    const isNative = Capacitor.isNativePlatform();
    const scrollRef = useRef<HTMLDivElement>(null);
    const deviceInfo: { deviceId: string | null, language: string | null } = useDeviceInfo();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch
    } = useFriendshipReceivedRequests(20);
    const showToast = useToastStore((state) => state.showToast);
    const { mutate: acceptRequest } = useAcceptFriendRequest(showToast);
    const { mutate: rejectRequest } = useRejectFriendRequest(showToast);
    const { setRoomChatInfo } = useSocialChatStore();
    useSocialSignalR(deviceInfo.deviceId ?? "", {
        roomId: "",
        refetchRoomData: () => { void refetch(); },
        autoConnect: true,
        enableDebugLogs: false,
    });
    const users = data?.pages.flat() ?? [];
    const handleClickMessage = async (user: any) => {
        try {
            if (user?.roomChat?.code) {
                setRoomChatInfo(user?.roomChat);
                history.push(`/social-chat/t/${user?.roomChat?.code}`);
            } else {
                setRoomChatInfo({
                    id: 0,
                    code: "",
                    title: user?.fullName || "Anonymous",
                    avatarRoomChat: user?.avatar || "/favicon.png",
                    type: 0,
                    status: 0,
                    createDate: new Date().toISOString(),
                    updateDate: new Date().toISOString(),
                    unreadCount: 0,
                    lastMessageInfo: null,
                    participants: [],
                    topic: null,

                });
                history.push(`/social-chat/t`);
                const chatData = await createAnonymousChatRoom(user.fromUserId);
                if (chatData?.chatCode) {
                    history.replace(`/social-chat/t/${chatData.chatCode}`);
                }
            }
        } catch (error) {
            console.error("Tạo phòng chat thất bại:", error);
        }
    };
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const handleScroll = () => {
            if (
                el.scrollTop + el.clientHeight >= el.scrollHeight - 100 &&
                hasNextPage &&
                !isFetchingNextPage
            ) {
                fetchNextPage();
            }
        };

        el.addEventListener("scroll", handleScroll);
        return () => el.removeEventListener("scroll", handleScroll);
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <div className="h-screen">
            <div
                ref={scrollRef}
                className={`overflow-y-auto px-6 pt-4 pb-28 ${isNative
                    ? "max-h-[85vh]"
                    : "max-h-[75vh] lg:max-h-[75vh] xl:max-h-[85vh]"
                    }`}
            >
                {isLoading ? (
                    <p className="text-center text-gray-400">{t("Loading requests...")}</p>
                ) : users.length === 0 ? (
                    <p className="text-center py-2  text-gray-400">{t("No requests found.")}</p>
                ) : (
                    users.map((user: any) => (
                        <div
                            key={user.id}
                            className="py-2 flex items-center justify-between bg-white hover:bg-gray-100 border-b border-netural-50"
                        >
                            <div
                                onClick={() => handleClickMessage(user)}
                                className="flex items-center cursor-pointer"
                            >

                                <img
                                    src={user?.fromUser?.avatar || avatarFallback}
                                    alt={user?.fromUser?.name || 'User Avatar'}
                                    className="w-[50px] h-[50px] rounded-2xl object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = avatarFallback;
                                    }}
                                />
                                <p className="ml-3 text-base font-semibold truncate max-w-xs">
                                    {user?.fromUser?.fullName || 'No Name'}
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => acceptRequest(user.id)}
                                    className="text-green-500 hover:text-green-700"
                                >
                                    <AcceptFriendIcon />
                                </button>
                                <button
                                    onClick={() => rejectRequest(user.id)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <RejectFriendIcon />
                                </button>
                            </div>
                        </div>
                    ))
                )}

                {isFetchingNextPage && (
                    <p className="text-center text-gray-400 text-sm mt-4">
                        Đang tải thêm...
                    </p>
                )}
            </div>
        </div>
    );
}

export default SocialChatListRequest;
