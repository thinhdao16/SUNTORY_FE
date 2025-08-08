import { Capacitor } from '@capacitor/core';
import { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { RoomChatInfo, useListChatRooms, useUserChatRooms } from '../hooks/useSocialChat';
import { useSocialChatStore } from '@/store/zustand/social-chat-store';
import { useTranslation } from 'react-i18next';
import { formatTimeFromNow } from '@/utils/formatTime';
import { useSocialSignalRListChatRoom } from '@/hooks/useSocialSignalRListChatRoom';
import useDeviceInfo from '@/hooks/useDeviceInfo';

export default function SocialChatRecent() {
  const { t } = useTranslation();
  const history = useHistory();
  const isNative = Capacitor.isNativePlatform();
  const deviceInfo: { deviceId: string | null } = useDeviceInfo();
  
  // Get lastMessage function from store
  const { setRoomChatInfo, getLastMessageForRoom,lastMessageByRoomId } = useSocialChatStore();
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserChatRooms();
console.log(lastMessageByRoomId)
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

  const chatRooms = data?.pages?.flat() ?? [];
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const getDisplayMessageText = (room: RoomChatInfo) => {
    const storeLastMessage = getLastMessageForRoom(room.code);
    if (storeLastMessage) {
      return storeLastMessage.messageText || "📷 Hình ảnh";
    }
    
    return room?.lastMessageInfo?.messageText || t('No messages');
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
          {chatRooms.map((room: RoomChatInfo) => (
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
                  src={room?.avatarRoomChat || '/favicon.png'}
                  alt={room?.title}
                  className="w-[50px] h-[50px] rounded-2xl object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/favicon.png';
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
                <p className="text-xs text-gray-400">{formatTimeFromNow(room.updateDate, t)}</p>
              </div>
            </div>
          ))}

          {(isLoading || isFetchingNextPage) && (
            <div className="text-center py-4 text-gray-500 text-sm">{t('Loading...')}</div>
          )}

          {!hasNextPage && !isLoading && (
            <div className="text-center py-2 text-xs text-gray-400">{t('No more chats')}</div>
          )}
        </div>
      </div>
    </div>
  );
}