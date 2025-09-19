import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiSearch } from "react-icons/fi";
import { useAcceptFriendRequest, useCancelFriendRequest, useRejectFriendRequest, useSearchFriendshipUsers, useSendFriendRequest } from "@/pages/SocialPartner/hooks/useSocialPartner";
import { useDebounce } from "@/hooks/useDebounce";
import AddFriendIcon from "@/icons/logo/social-chat/add-friend.svg?react";
import CancelInnovationIcon from "@/icons/logo/social-chat/cancel-innovation.svg?react";
import AcceptFriendIcon from "@/icons/logo/social-chat/accept-friend.svg?react";
import RejectFriendIcon from "@/icons/logo/social-chat/reject-friend.svg?react";
import MessagesIcon from "@/icons/logo/social-chat/messages.svg?react";
import { useToastStore } from "@/store/zustand/toast-store";
import { useHistory } from "react-router";
import { useCreateAnonymousChat } from "@/pages/SocialChat/hooks/useSocialChat";
import { useSocialChatStore } from "@/store/zustand/social-chat-store";
import { useSocialSignalR } from "@/hooks/useSocialSignalR";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import ConfirmModal from "@/components/common/modals/ConfirmModal";
import { t } from "@/lib/globalT";

interface SearchPartnerModalProps {
  isOpen: boolean;
  translateY: number;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  onClose: () => void;
}

type ConfirmState = {
  isOpen: boolean;
  type: "cancel" | "reject" | null;
  targetId: number | null;
  userName: string;
};

const SearchPartnerModal: React.FC<SearchPartnerModalProps> = ({
  isOpen,
  translateY,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    type: null,
    targetId: null,
    userName: ""
  });

  const deviceInfo: { deviceId: string | null, language: string | null } = useDeviceInfo();

  const showToast = useToastStore((state) => state.showToast);
  const { setRoomChatInfo } = useSocialChatStore();

  const history = useHistory();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useSearchFriendshipUsers(debouncedQuery, 10);

  const sendRequest = useSendFriendRequest(showToast);
  const cancelRequest = useCancelFriendRequest(showToast);
  const acceptRequest = useAcceptFriendRequest(showToast);
  const rejectRequest = useRejectFriendRequest(showToast);
  const { mutateAsync: createAnonymousChat } = useCreateAnonymousChat();
  
  useSocialSignalR(deviceInfo.deviceId ?? "", {
    roomId: "",
    refetchRoomData: () => { void refetch(); },
    autoConnect: true,
    enableDebugLogs: false,
  });
  
  const users = data?.pages.flatMap((page) => page ?? []) ?? [];
  const scrollRef = useRef<HTMLDivElement>(null);

  const openConfirm = (type: "cancel" | "reject", targetId: number, userName: string) => {
    setConfirmState({
      isOpen: true,
      type,
      targetId,
      userName
    });
  };

  const closeConfirm = () => {
    setConfirmState({
      isOpen: false,
      type: null,
      targetId: null,
      userName: ""
    });
  };

  const handleConfirm = () => {
    if (!confirmState.targetId || !confirmState.type) return;

    if (confirmState.type === "cancel") {
      cancelRequest.mutate(confirmState.targetId);
    } else if (confirmState.type === "reject") {
      rejectRequest.mutate(confirmState.targetId);
    }

    closeConfirm();
  };

  const getConfirmContent = () => {
    switch (confirmState.type) {
      case "cancel":
        return {
          title: t("Cancel Friend Request?"),
          message: t("Are you sure you want to cancel your friend request to {{name}}?", { name: confirmState.userName }),
          confirmText: t("Yes, cancel"),
          cancelText: t("Keep request")
        };
      case "reject":
        return {
          title: t("Reject Friend Request?"),
          message: t("Are you sure you want to reject the friend request from {{name}}?", { name: confirmState.userName }),
          confirmText: t("Yes, reject"),
          cancelText: t("Keep request")
        };
      default:
        return {
          title: t("Are you sure?"),
          message: "",
          confirmText: t("Confirm"),
          cancelText: t("Cancel")
        };
    }
  };

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isFetchingNextPage || !hasNextPage) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      fetchNextPage();
    }
  }, [fetchNextPage, isFetchingNextPage, hasNextPage]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
          chatInfo: null,
        });
        history.push(`/social-chat/t`);
        const chatData = await createAnonymousChat(user.id);
        if (chatData?.chatCode) {
          history.replace(`/social-chat/t/${chatData.chatCode}`);
        }
      }
    } catch (error) {
      console.error("Tạo phòng chat thất bại:", error);
    }
  };
  const handleViewProfile = (userId: number) => {
    history.push(`/profile/${userId}`);
};
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query) {
        refetch();
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [query, refetch]);

  if (!isOpen) return null;

  const confirmContent = getConfirmContent();

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[150] h-full flex justify-center items-end"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={handleOverlayClick}
      >
        <div
          className="bg-white w-full max-h-[95vh] min-h-[55vh] rounded-t-3xl transition-transform duration-300 ease-out"
          style={{ transform: `translateY(${translateY}px)`, touchAction: "none" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <button onClick={onClose} className="text-gray-700 text-lg">
              <FiX />
            </button>
            <h1 className="text-sm font-semibold text-gray-900">{t("Search")}</h1>
            <div className="w-5" />
          </div>
          
          <div className="flex items-center bg-gray-100 mx-4 rounded-full px-4 py-2 mb-4">
            <FiSearch className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder={t("Username")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent text-sm outline-none flex-grow"
              autoFocus
            />
            {query && (
              <FiX
                onClick={() => setQuery("")}
                className="text-gray-400 cursor-pointer"
              />
            )}
          </div>
          
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="overflow-y-auto px-4 pb-6 max-h-[60vh]"
          >
            {!query && (
              <p className="text-gray-400 text-sm text-center mt-12">
                {t('Enter a username to search')}
              </p>
            )}
            {isLoading && query && (
              <p className="text-center text-gray-400 text-sm mt-12">{t("Loading...")}</p>
            )}
            {query && !isLoading && users.length === 0 && (
              <div className="flex flex-col items-center justify-center mt-20 text-center text-gray-500">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-3">
                  <FiSearch className="text-white text-xl" />
                </div>
                <p className="text-sm font-medium">
                  {t("No relevant search results found.")}
                </p>
              </div>
            )}
            {users.length > 0 && (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user?.id}
                    className="flex items-center justify-between border border-netural-50 px-3 py-2 rounded-xl"
                  >
                    <div className="flex items-center" onClick={() => handleViewProfile(user?.id)}>
                      <img
                        src={user?.avatar || "/favicon.png"}
                        alt={user?.fullName}
                        className="w-14 h-14 rounded-2xl mr-3"
                      />
                      <span className="text-sm font-medium ">
                        {user?.fullName}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {!user?.isFriend && (
                        user?.isRequestSender ? (
                          <button
                            onClick={() => openConfirm("cancel", user.friendRequest.id, user?.fullName)}
                          >
                            <CancelInnovationIcon />
                          </button>
                        ) : !user?.friendRequest ? (
                          <button
                            onClick={() => sendRequest.mutate(user.id)}
                          >
                            <AddFriendIcon />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => acceptRequest.mutate(user.friendRequest.id)}
                            >
                              <AcceptFriendIcon />
                            </button>
                            <button
                              onClick={() => openConfirm("reject", user.friendRequest.id, user?.fullName)}
                            >
                              <RejectFriendIcon />
                            </button>
                          </>
                        )
                      )}
                      <button type="button" onClick={() => handleClickMessage(user)} >
                        <MessagesIcon />
                      </button>
                    </div>
                  </div>
                ))}
                {isFetchingNextPage && (
                  <p className="text-center text-gray-400 text-sm mt-2">{t("Loading more...")}</p>
                )}
              </div>
            )}
          </div>

          <div className="h-6" />
        </div>
      </motion.div>

      {/* ✅ Confirm Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmContent.title}
        message={confirmContent.message}
        confirmText={confirmContent.confirmText}
        cancelText={confirmContent.cancelText}
        onConfirm={handleConfirm}
        onClose={closeConfirm}
      />
    </AnimatePresence>
  );
};

export default SearchPartnerModal;
