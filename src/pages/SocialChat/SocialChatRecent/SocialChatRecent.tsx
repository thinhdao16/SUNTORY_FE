import { Capacitor } from '@capacitor/core';
import { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { useListChatRooms, useUserChatRooms } from '../hooks/useSocialChat';
import { useSocialChatStore } from '@/store/zustand/social-chat-store';
import { useTranslation } from 'react-i18next';
import { formatTimeFromNow } from '@/utils/formatTime';
import { useSocialSignalRListChatRoom } from '@/hooks/useSocialSignalRListChatRoom';
import useDeviceInfo from '@/hooks/useDeviceInfo';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg";
import { RoomChatInfo } from '@/types/social-chat';
import { ChatInfoType } from '@/constants/socialChat';
import { useAuthInfo } from '@/pages/Auth/hooks/useAuthInfo';

export default function SocialChatRecent() {
  const { t } = useTranslation();
  const history = useHistory();
  const isNative = Capacitor.isNativePlatform();
  const deviceInfo: { deviceId: string | null } = useDeviceInfo();

  const { chatRooms, setChatRooms, setRoomChatInfo, getLastMessageForRoom, getRoomUnread, clearRoomUnread } = useSocialChatStore();

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserChatRooms();

  const {
    data: listDataChatRooms,
  } = useListChatRooms();
  const { data: userInfo } = useAuthInfo();

  const listRoomIdChatRooms = listDataChatRooms?.pages?.flat()?.map((room: RoomChatInfo) => room.code) || [];

  useSocialSignalRListChatRoom(deviceInfo.deviceId ?? '', {
    roomIds: listRoomIdChatRooms,
    autoConnect: true,
    enableDebugLogs: false
  });

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (data?.pages) {
      const allRooms = data.pages.flat();
      setChatRooms(allRooms);
    }
  }, [data, setChatRooms]);
  const getDisplayMessageText = (room: RoomChatInfo, currentUserId: number) => {
    const storeLast = getLastMessageForRoom(room.code);
    const last = storeLast ?? room?.lastMessageInfo;
    if (!last) return t('No messages');
    if (last.isRevoked === 1 || last.isRevoked === true) {
      return t('This message was removed');
    }
    const text = (last.messageText ?? '').trim();
    const attachments = Array.isArray(last.chatAttachments) ? last.chatAttachments : [];
    if (!text && attachments.length === 0) {
      return t('This message was removed');
    }
    let content = text || `📷 ${t('Photo')}`;
    if (room.type === ChatInfoType.UserVsUser) {
      if (last.userId === currentUserId) {
        content = `${t('You')}: ${content}`;
      }
    }

    if (room.type === ChatInfoType.Group) {
      if (last.userId !== currentUserId && last.userName) {
        content = `${last.userName}: ${content}`;
      } else if (last.userId === currentUserId) {
        content = `${t('You')}: ${content}`;
      }
    }

    return content;
  };

  const getLatestUpdateDate = (room: RoomChatInfo) => {
    const storeLastMessage = getLastMessageForRoom(room.code);
    if (storeLastMessage?.createDate) {
      const storeMessageDate = new Date(storeLastMessage.createDate).getTime();
      const roomUpdateDate = new Date(room.updateDate || 0).getTime();
      return storeMessageDate > roomUpdateDate ? storeLastMessage.createDate : room.updateDate;
    }
    return room.updateDate;
  };

  useEffect(() => {
    const handleScroll = () => {
      const el = scrollRef.current;
      if (!el || isFetchingNextPage || !hasNextPage) return;

      const threshold = 100;
      const isBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
      if (isBottom) fetchNextPage();
    };

    const el = scrollRef.current;
    el?.addEventListener('scroll', handleScroll);
    return () => el?.removeEventListener('scroll', handleScroll);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="h-screen">
      <div
        ref={scrollRef}
        className={`overflow-y-auto px-6 pt-4 pb-24 ${isNative
          ? 'max-h-[85vh]'
          : 'max-h-[75vh] lg:max-h-[75vh] xl:max-h-[85vh]'
          }`}
      >
        <div className="">
          {chatRooms.map((room) => {
            const unread = room.unreadCount ?? getRoomUnread(room.code) ?? 0;
            const isUnread = unread > 0;
            return (
              <div
                key={room.id}
                onClick={() => {
                  setRoomChatInfo(room);
                  clearRoomUnread(room.code);
                  history.push(`/social-chat/t/${room.code}`);
                }}
                className="py-2 flex items-center justify-between bg-white hover:bg-gray-100 cursor-pointer"
              >
                <div className="flex items-center">
                  <img
                    src={room?.avatarRoomChat || avatarFallback}
                    alt={room?.title}
                    className={`w-[50px] h-[50px] rounded-2xl object-cover `}
                    onError={(e) => { e.currentTarget.src = avatarFallback; }}
                  />
                  <div className="ml-3">
                    <p className="text-base font-semibold truncate max-w-xs">{room.title}</p>
                    <p
                      className={`text-xs max-w-xs  text-netural-300 ${isUnread && "font-semibold " } overflow-hidden text-ellipsis whitespace-nowrap`}
                    >
                      {(() => {
                        const text = getDisplayMessageText(room, userInfo?.id || 0);
                        return text.length > 38 ? text.slice(0, 38) + "..." : text;
                      })()}
                    </p>
                  </div>
                </div>

                <div className="text-right min-w-[64px] flex flex-col items-end gap-2 justify-center">
                  <p className={`text-xs text-netural-500 ${isUnread && 'font-semibold '}`}>
                    {formatTimeFromNow(getLatestUpdateDate(room), t)}
                  </p>
                  {isUnread && (
                    <button className="flex items-center justify-center min-w-[16px] min-h-[16px] aspect-square p-1 rounded-full text-white text-[8.53px] bg-main">
                      {unread > 99 ? '99+' : unread}
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {(isLoading || isFetchingNextPage) && (
            <div className="text-center py-4 text-gray-500 text-sm">{t('Loading...')}</div>
          )}

          {!hasNextPage && !isLoading && chatRooms.length === 0 && (
            <div className="text-center py-2  text-gray-400">{t('No more chats')}</div>
          )}
        </div>
      </div>
    </div>
  );
}