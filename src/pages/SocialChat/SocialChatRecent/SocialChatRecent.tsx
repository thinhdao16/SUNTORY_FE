import { Capacitor } from '@capacitor/core';
import { useEffect, useRef, useMemo } from 'react';
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
import { useSocialSignalR } from '@/hooks/useSocialSignalR';
import { useFriendshipReceivedRequests } from '@/pages/SocialPartner/hooks/useSocialPartner';
import { generatePreciseTimestampFromDate } from '@/utils/time-stamp';
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { SystemMessageType } from "@/constants/socialChat";
import MuteIcon from "@/icons/logo/social-chat/mute.svg?react"
import UnMuteIcon from "@/icons/logo/social-chat/unmute.svg?react"
dayjs.extend(utc);

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
    refetch: refetchUserChatRooms
  } = useUserChatRooms();
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
  // useSocialSignalR(deviceInfo.deviceId ?? "", {
  //   roomId: "",
  //   refetchRoomData: () => { void refetchFriendshipRequests(); void refetchUserChatRooms(); },
  //   autoConnect: true,
  //   enableDebugLogs: false,
  // });

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
            systemPreview = `🎉 ${actorName} ${t("has created the group!")}`;
            break;
          }

          case "NOTIFY_GROUP_CHAT_KICKED": {
            const kickedUser = systemObj.Users?.[0];
            const kickedName = kickedUser?.Id === currentUserId ? t("You") : kickedUser?.FullName || t("User");
            systemPreview = `❌ ${actorName} ${t("has removed")} ${kickedName}`;
            break;
          }

          case "NOTIFY_GROUP_CHAT_ADD_MEMBER": {
            if (systemObj.Users && systemObj.Users.length > 0) {
              const names = systemObj.Users.map((u: any) =>
                u.Id === currentUserId ? t("You") : u.FullName || u.UserName || "User"
              );
              if (names.length === 1) {
                systemPreview = `➕ ${actorName} ${t("has added")} ${names[0]}`;
              } else if (names.length <= 2) {
                systemPreview = `➕ ${actorName} ${t("has added")} ${names.join(t(" and "))}`;
              } else {
                systemPreview = `➕ ${actorName} ${t("has added")} ${names.length} ${t("members")}`;
              }
            } else {
              systemPreview = `➕ ${actorName} ${t("has added new member")}`;
            }
            break;
          }

          case "NOTIFY_GROUP_CHAT_USER_LEAVE_GROUP": {
            systemPreview = `🚶 ${actorName} ${t("has left the group")}`;
            break;
          }

          case "NOTIFY_GROUP_CHAT_ADMIN_RENAME_GROUP": {
            systemPreview = `✏️ ${actorName} ${t("has renamed the group")}`;
            break;
          }

          case "NOTIFY_GROUP_CHAT_ADMIN_CHANGE_AVATAR_GROUP": {
            systemPreview = `🖼️ ${actorName} ${t("has changed the group avatar")}`;
            break;
          }

          case "NOTIFY_GROUP_CHAT_ADMIN_LEAVE_GROUP": {
            systemPreview = `👋 ${actorName} ${t("has left the group as admin")}`;
            break;
          }

          case "NOTIFY_GROUP_CHAT_CHANGE_ADMIN": {
            const newAdmin = systemObj.Users?.[0];
            const newAdminName = newAdmin?.Id === currentUserId ? t("You") : newAdmin?.FullName || t("User");
            systemPreview = `👑 ${actorName} ${t("has appointed")} ${newAdminName} ${t("as admin")}`;
            break;
          }

          case "NOTIFY_FRIENDLY_ACCEPTED": {
            const friend = systemObj.Users?.[0];
            const friendName = friend?.Id === currentUserId ? t("You") : friend?.FullName || t("User");
            systemPreview = `💫 ${actorName} ${t("and")} ${friendName} ${t("are now friends")}`;
            break;
          }

          default:
            systemPreview = `ℹ️ ${t("System notification")}`;
        }
      }
    } catch {
    }
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
    const arr = [...data?.pages.flat() || chatRooms];
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
  console.log(sortedChatRooms)
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
                  {/* {!room.isQuiet && (
                    <p className="text-[11px] text-netural-300">
                      <UnMuteIcon className="w-[14px] h-[14px] inline-block mr-1" />
                    </p>
                  )} */}
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
      </div>
    </div>
  );
}