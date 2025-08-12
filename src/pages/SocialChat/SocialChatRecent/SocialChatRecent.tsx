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

export default function SocialChatRecent() {
  const { t } = useTranslation();
  const history = useHistory();
  const isNative = Capacitor.isNativePlatform();
  const deviceInfo: { deviceId: string | null } = useDeviceInfo();
  
  const { 
    chatRooms,
    setChatRooms,
    setRoomChatInfo, 
    getLastMessageForRoom 
  } = useSocialChatStore();

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

  const listRoomIdChatRooms = listDataChatRooms?.pages?.flat()?.map((room: RoomChatInfo) => room.code) || [];
  
  const {
    isConnected,
    joinedRooms,
    getConnectionStatus
  } = useSocialSignalRListChatRoom(deviceInfo.deviceId ?? '', {
    roomIds: listRoomIdChatRooms,
    autoConnect: true,
    enableDebugLogs: true
  });

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (data?.pages) {
      const allRooms = data.pages.flat();
      setChatRooms(allRooms);
    }
  }, [data, setChatRooms]);

  const getDisplayMessageText = (room: RoomChatInfo) => {
    const storeLastMessage = getLastMessageForRoom(room.code);
    if (storeLastMessage) {
      return storeLastMessage.messageText || "📷 Hình ảnh";
    }
    
    return room?.lastMessageInfo?.messageText || t('No messages');
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
          {/* Use chatRooms from store instead of computed useMemo */}
          {chatRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => {
                setRoomChatInfo(room);
                history.push(`/social-chat/t/${room.code}`);
              }}
              className="py-2 flex items-center justify-between bg-white hover:bg-gray-100 cursor-pointer"
            >
              <div className="flex items-center">
                <img
                  src={room?.avatarRoomChat || avatarFallback}
                  alt={room?.title}
                  className="w-[50px] h-[50px] rounded-2xl object-cover"
                  onError={(e) => {
                    e.currentTarget.src = avatarFallback;
                  }}
                />
                <div className="ml-3">
                  <p className="text-base font-semibold truncate max-w-xs">{room.title}</p>
                  <p className="text-xs text-gray-500 truncate max-w-xs">
                    {getDisplayMessageText(room)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">
                  {formatTimeFromNow(getLatestUpdateDate(room), t)}
                </p>
              </div>
            </div>
          ))}

          {(isLoading || isFetchingNextPage) && (
            <div className="text-center py-4 text-gray-500 text-sm">{t('Loading...')}</div>
          )}

          {!hasNextPage && !isLoading && chatRooms.length === 0 && (
            <div className="text-center py-2 text-xs text-gray-400">{t('No more chats')}</div>
          )}
        </div>
      </div>
    </div>
  );
}