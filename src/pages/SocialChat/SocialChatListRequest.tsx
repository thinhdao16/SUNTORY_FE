import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { BsPerson } from 'react-icons/bs';
import { useHistory } from 'react-router';
import { useAcceptFriendRequest, useFriendshipReceivedRequests, useRejectFriendRequest } from '../SocialPartner/hooks/useSocialPartner';
import AcceptFriendIcon from "@/icons/logo/social-chat/accept-friend.svg?react";
import RejectFriendIcon from "@/icons/logo/social-chat/reject-friend.svg?react";
import { useToastStore } from '@/store/zustand/toast-store';

function SocialChatListRequest() {
    const history = useHistory();
    const isNative = Capacitor.isNativePlatform();
    const scrollRef = useRef<HTMLDivElement>(null);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useFriendshipReceivedRequests(20);

    const showToast = useToastStore((state) => state.showToast);
    const { mutate: acceptRequest } = useAcceptFriendRequest(showToast);
    const { mutate: rejectRequest } = useRejectFriendRequest(showToast);

    const users = data?.pages.flat() ?? [];

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
                    <p className="text-center text-gray-400">Đang tải lời mời...</p>
                ) : users.length === 0 ? (
                    <p className="text-center text-gray-500 mt-10">Không có lời mời nào.</p>
                ) : (
                    users.map((user: any) => (
                        <div
                            key={user.id}
                            className="py-2 flex items-center justify-between bg-white hover:bg-gray-100 border-b border-netural-50"
                        >
                            <div
                                onClick={() => history.push(`/social-chat/t/${user.id}`)}
                                className="flex items-center cursor-pointer"
                            >
                                <div className="w-[50px] h-[50px] bg-[#28B49B] rounded-2xl flex items-center justify-center">
                                    <BsPerson className="w-full h-full text-white" />
                                </div>
                                <p className="ml-3 text-base font-semibold truncate max-w-xs">
                                    {user.fullName || user.name || 'No Name'}
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
