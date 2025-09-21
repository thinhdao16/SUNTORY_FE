import { Capacitor } from '@capacitor/core';
import { useEffect, useRef, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { RoomChatInfo, useListChatRooms, useNotificationCounts, useUserChatRooms } from '../hooks/useSocialChat';
import { useSocialChatStore } from '@/store/zustand/social-chat-store';
import { useTranslation } from 'react-i18next';
import { formatTimeFromNow } from '@/utils/formatTime';
import { useSocialSignalRListChatRoom } from '@/hooks/useSocialSignalRListChatRoom';
import useDeviceInfo from '@/hooks/useDeviceInfo';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg";
import { ChatInfoType, KEYCHATFORMATNOTI } from '@/constants/socialChat';
import { useAuthInfo } from '@/pages/Auth/hooks/useAuthInfo';
import { useFriendshipReceivedRequests } from '@/pages/SocialPartner/hooks/useSocialPartner';
import { generatePreciseTimestampFromDate } from '@/utils/time-stamp';
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { SystemMessageType } from "@/constants/socialChat";
import MuteIcon from "@/icons/logo/social-chat/mute.svg?react"
import UnMuteIcon from "@/icons/logo/social-chat/unmute.svg?react"
import { useSocialSignalR } from '@/hooks/useSocialSignalR';
import PullToRefresh from '@/components/common/PullToRefresh';
import { IonContent } from '@ionic/react';
import { useRefreshCallback } from '@/contexts/RefreshContext';
dayjs.extend(utc);

export default function SocialChatRecent() {
  const { t } = useTranslation();
  const history = useHistory();
  const isNative = Capacitor.isNativePlatform();
  const deviceInfo: { deviceId: string | null } = useDeviceInfo();
  const [refreshing, setRefreshing] = useState(false);

  const { chatRooms, setChatRooms, setRoomChatInfo, getLastMessageForRoom, getRoomUnread, clearRoomUnread } = useSocialChatStore();

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchUserChatRooms
  } = useUserChatRooms(15,setChatRooms);
  const {
    refetch: refetchFriendshipRequests
  } = useFriendshipReceivedRequests(20);
  const {
    data: listDataChatRooms,
  } = useListChatRooms();
  useNotificationCounts({
    enabled: true,
    refetchInterval: 30000
  });

  const { data: userInfo } = useAuthInfo();

  const listRoomIdChatRooms = listDataChatRooms?.pages?.flat()?.map((room: RoomChatInfo) => room.code) || [];

  useSocialSignalRListChatRoom(deviceInfo.deviceId ?? '', {
    roomIds: listRoomIdChatRooms,
    autoConnect: true,
    enableDebugLogs: false,
    refetchUserChatRooms
  });
  useSocialSignalR(deviceInfo.deviceId ?? "", {
    roomId: "",
    refetchRoomData: () => { void refetchFriendshipRequests(); void refetchUserChatRooms(); },
    autoConnect: true,
    enableDebugLogs: false,
  });

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLIonContentElement>(null);
  const handleRefresh = async () => {
    setRefreshing(true);
    
    if (contentRef.current) {
      contentRef.current.scrollToTop(300); 
    }
    
    try {
      await Promise.all([
        refetchUserChatRooms(),
        refetchFriendshipRequests()
      ]);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useRefreshCallback('/social-chat', handleRefresh);

  // useEffect(() => {
  //   if (data?.pages) {
  //     const allRooms = data.pages.flat();
  //     setChatRooms(allRooms);
  //   }
  // }, [data ,setChatRooms]);
  const getDisplayMessageText = (room: RoomChatInfo, currentUserId: number) => {
    const storeLast = getLastMessageForRoom(room.code);
    const last = storeLast ?? room?.lastMessageInfo;
    if (!last) {
      if (room.type === ChatInfoType.UserVsUser) {
        const userName = room.title || t('this user');
        if (room?.isFriend === true) {
          return t('You and {{name}} are now friends', { name: userName });
        }
        if (room?.friendRequest?.fromUserId === currentUserId) {
          return t('You have sent a friend request to {{name}}', { name: userName });
        }
        if (room?.friendRequest?.toUserId === currentUserId) {
          return t('{{name}} has sent you a friend request', { name: userName });
        }
        return t('Send a friend request to {{name}}', { name: userName });
      }
      return '';
    }
    if (last.isRevoked === 1 || last.isRevoked === true) {
      return t('This message was removed');
    }
    const text = (last.messageText ?? '').trim();
    const attachments = Array.isArray(last.chatAttachments) ? last.chatAttachments : [];
    if (!text && attachments.length === 0) {
      return t('This message was removed');
    }

    let systemPreview = "";
    try {
      const systemObj = JSON.parse(text);
      if (systemObj && systemObj.Event && systemObj.Key === KEYCHATFORMATNOTI) {
        const actor = systemObj.Actor;
        const actorName = actor?.Id === currentUserId ? t("You") : actor?.FullName || t("Admin");

        const eventType = systemObj.Event;
        const eventValue = SystemMessageType[eventType as keyof typeof SystemMessageType];

        switch (eventType) {
          case "NOTIFY_GROUP_CHAT_CREATED": {
            systemPreview = `${actorName} ${t("has created the group!")}`;
            break;
          }

          case "NOTIFY_GROUP_CHAT_KICKED": {
            const kickedUser = systemObj.Users?.[0];
            const kickedName = kickedUser?.Id === currentUserId ? t("You") : kickedUser?.FullName || t("User");
            systemPreview = `${actorName} ${t("has removed")} ${kickedName}`;
            break;
          }

          case "NOTIFY_GROUP_CHAT_ADD_MEMBER": {
            if (systemObj.Users && systemObj.Users.length > 0) {
              const names = systemObj.Users.map((u: any) =>
                u.Id === currentUserId ? t("You") : u.FullName || u.UserName || "User"
              );
              if (names.length === 1) {
                systemPreview = `${actorName} ${t("has added")} ${names[0]}`;
              } else if (names.length <= 2) {
                systemPreview = `${actorName} ${t("has added")} ${names.join(t(" and "))}`;
              } else {
                systemPreview = `${actorName} ${t("has added")} ${names.length} ${t("members")}`;
              }
            } else {
              systemPreview = `${actorName} ${t("has added new member")}`;
            }
            break;
          }
          case "NOTIFY_GROUP_CHAT_USER_LEAVE_GROUP": {
            systemPreview = `${actorName} ${t("has left the group")}`;
            break;
          }
          case "NOTIFY_GROUP_CHAT_ADMIN_RENAME_GROUP": {
            systemPreview = `${actorName} ${t("has renamed the group")}`;
            break;
          }
          case "NOTIFY_GROUP_CHAT_ADMIN_CHANGE_AVATAR_GROUP": {
            systemPreview = `${actorName} ${t("has changed the group avatar")}`;
            break;
          }
          case "NOTIFY_GROUP_CHAT_ADMIN_LEAVE_GROUP": {
            systemPreview = `${actorName} ${t("has left the group as admin")}`;
            break;
          }
          case "NOTIFY_GROUP_CHAT_CHANGE_ADMIN": {
            const newAdmin = systemObj.Users?.[0];
            const newAdminName = newAdmin?.Id === currentUserId ? t("You") : newAdmin?.FullName || t("User");
            systemPreview = `${actorName} ${t("has appointed")} ${newAdminName} ${t("as admin")}`;
            break;
          }
          case "NOTIFY_FRIENDLY_ACCEPTED": {
            systemPreview = `${t("You")} ${t("and")} ${room?.title} ${t("are now friends")}`;
            break;
          }
          default:
            systemPreview = `${t("System notification")}`;
        }
      }
    } catch {}
    if (systemPreview) return systemPreview;

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
    if (storeLastMessage?.updateDate) {
      const storeMessageDate = new Date(storeLastMessage.updateDate).getTime();
      const roomUpdateDate = new Date(room.updateDate || 0).getTime();
      return storeMessageDate > roomUpdateDate ? storeLastMessage.updateDate : room.updateDate;
    }
    return room.updateDate;
  };

  const toMsUTC = (input: unknown): number => {
    if (!input) return 0;
    if (typeof input === "number") return input;
    if (typeof input !== "string") return 0;

    let s = input.trim();
    s = s.replace(/(\.\d{3})\d+/, "$1");

    if (!/[zZ]|[+\-]\d{2}:\d{2}$/.test(s)) {
      s += "Z";
    }

    const d = dayjs.utc(s);
    if (d.isValid()) return d.valueOf();

    const t = new Date(s).getTime();
    return Number.isFinite(t) ? t : 0;
  };

  const getSortTimestamp = (room: RoomChatInfo): number => {
    const lm = room.lastMessageInfo?.createDate;
    const up = room.updateDate;
    const cr = room.createDate;
    return Math.max(toMsUTC(up), toMsUTC(cr));
  };

  const sortedChatRooms = useMemo(() => {
    const arr = [...chatRooms];
    arr.sort((a, b) => {
      const ta = getSortTimestamp(a);
      const tb = getSortTimestamp(b);
      if (tb !== ta) return tb - ta;

      const ua = a.unreadCount ?? 0;
      const ub = b.unreadCount ?? 0;
      if (ub !== ua) return ub - ua;

      return (b.id ?? 0) - (a.id ?? 0);
    });
    return arr;
  }, [chatRooms]);
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
    <IonContent 
    ref={contentRef}
    className={`no-scrollbar pb-24`}
    style={{ 
      height: 'calc(100vh - 150px)'
    }}
    scrollY={true}
    >
        <div className="h-screen relative">
          {/* Facebook-style refresh loading indicator */}
          {refreshing && (
            <div className="absolute top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm">
              <div className="flex items-center justify-center py-3">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  <span className="text-sm text-gray-600">{t('Refreshing...')}</span>
                </div>
              </div>
            </div>
          )}
          
          <div
            ref={scrollRef}
            className={`   px-4 pt-4 `}
          >
      <PullToRefresh onRefresh={handleRefresh}>

        <div className="pb-24">
          {sortedChatRooms.map((room) => {
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
                <div className="flex items-center flex-1 min-w-0">
                  <img
                    src={room?.avatarRoomChat || avatarFallback}
                    alt={room?.title}
                    className="w-[50px] h-[50px] rounded-2xl object-cover flex-none"
                    onError={(e) => { e.currentTarget.src = avatarFallback; }}
                  />
                  <div className="ml-3 min-w-0 flex-1 overflow-hidden">
                    <p className="text-base font-semibold truncate">{room.title}</p>
                    <p
                      className={`text-xs text-netural-300 ${isUnread ? "font-semibold" : ""} truncate`}
                    >
                      {(() => {
                        const text = getDisplayMessageText(room, userInfo?.id || 0);
                        return text.length > 80 ? text.slice(0, 80) + "..." : text;
                      })()}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right w-[92px] flex flex-col items-end gap-2 justify-center">
                  <p className={`text-xs text-netural-500 ${isUnread ? 'font-semibold' : ''}`}>
                    {formatTimeFromNow(getLatestUpdateDate(room), t)}
                  </p>
                  {room.isQuiet && (
                    <p className="text-[11px] text-netural-300">
                      <MuteIcon className="w-[14px] h-[14px] inline-block mr-1" />
                    </p>
                  )}
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
            <div className="text-center py-2  text-gray-400">{t('No more chats.')}</div>
          )}
        </div>
      </PullToRefresh>

      </div>
    </div>
    </IonContent>
  );
}