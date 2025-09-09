/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import ENV from "@/config/env";
import { useSocialChatStore } from "@/store/zustand/social-chat-store";
import { useAuthStore } from "@/store/zustand/auth-store";

export interface UseSocialSignalRListChatRoomOptions {
  roomIds: string[];
  autoConnect?: boolean;
  enableDebugLogs?: boolean;
  refetchUserChatRooms: () => void;
  preferWebSockets?: boolean;
}

export function useSocialSignalRListChatRoom(
  deviceId: string,
  options: UseSocialSignalRListChatRoomOptions
) {
  const {
    roomIds,
    autoConnect = true,
    enableDebugLogs = false,
    refetchUserChatRooms,
    preferWebSockets = true,
  } = options;

  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const isConnectedRef = useRef(false);

  const startedRef = useRef(false);
  const connectingRef = useRef(false);
  const startPromiseRef = useRef<Promise<void> | null>(null);

  const joinedRoomsRef = useRef<Set<string>>(new Set());
  const activeRoomsRef = useRef<string[]>([]);
  const joinedUserNotifyRef = useRef(false);

  const lastUnreadRef = useRef<Record<string, number>>({});

  const { isAuthenticated, user } = useAuthStore();
  const {
    updateLastMessage,
    updateChatRoomFromMessage,
    setRoomUnread,
    setNotificationCounts,
  } = useSocialChatStore();

  const refetchRef = useRef(refetchUserChatRooms);
  useEffect(() => { refetchRef.current = refetchUserChatRooms; }, [refetchUserChatRooms]);

  const log = useCallback(
    (message: string, ...args: any[]) => {
      if (enableDebugLogs) console.log(`[SignalR:List] ${message}`, ...args);
    },
    [enableDebugLogs]
  );

  const buildConnection = useCallback(() => {
    const token = () => localStorage.getItem("token") || "";
    const b = new signalR.HubConnectionBuilder().configureLogging(signalR.LogLevel.Warning);
    b.withUrl(`${ENV.BE}/chatHub?deviceId=${deviceId}`, {
      accessTokenFactory: token,
      ...(preferWebSockets
        ? { transport: signalR.HttpTransportType.WebSockets, skipNegotiation: true }
        : {}),
    });
    b.withAutomaticReconnect([0, 2000, 10000, 30000]);
    return b.build();
  }, [deviceId, preferWebSockets]);

  const joinUserNotify = useCallback(async () => {
    const conn = connectionRef.current;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) return false;
    if (joinedUserNotifyRef.current) return true;
    try {
      await conn.invoke("JoinUserNotify");
      joinedUserNotifyRef.current = true;
      log("Joined UserNotify");
      return true;
    } catch (e) {
      log("JoinUserNotify failed", e);
      return false;
    }
  }, [log]);

  const joinChatRooms = useCallback(async (chatRoomIds: string[]) => {
    const conn = connectionRef.current;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) return false;
    activeRoomsRef.current = chatRoomIds;

    for (const roomId of chatRoomIds) {
      if (joinedRoomsRef.current.has(roomId)) continue;
      try {
        await conn.invoke("JoinChatUserRoom", roomId);
        joinedRoomsRef.current.add(roomId);
        log(`Joined ${roomId}`);
      } catch (e) {
        log(`Join ${roomId} failed`, e);
      }
    }
    return true;
  }, [log]);

  const leaveChatRooms = useCallback(async (chatRoomIds: string[]) => {
    const conn = connectionRef.current;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) return false;

    for (const roomId of chatRoomIds) {
      if (!joinedRoomsRef.current.has(roomId)) continue;
      try {
        await conn.invoke("LeaveChatUserRoom", roomId);
        joinedRoomsRef.current.delete(roomId);
        log(`Left ${roomId}`);
      } catch (e) {
        log(`Leave ${roomId} failed`, e);
      }
    }
    return true;
  }, [log]);

  const attachHandlers = useCallback((connection: signalR.HubConnection) => {
    connection.off("ReceiveUserMessage");
    connection.on("ReceiveUserMessage", (message: any) => {
      const roomId = message?.chatInfo?.code || message?.roomId;
      if (!roomId) return;
      updateLastMessage(roomId, message);
      updateChatRoomFromMessage(message);
    });

    connection.off("UpdateUserMessage");
    connection.on("UpdateUserMessage", (message: any) => {
      const roomId = message?.chatInfo?.code || message?.roomId;
      if (!roomId) return;
      updateChatRoomFromMessage(message);
      if (message.isNotifyRoomChat === false) return;
      updateLastMessage(roomId, message);
    });

    connection.off("RevokeUserMessage");
    connection.on("RevokeUserMessage", (message: any) => {
      const roomId = message?.chatInfo?.code || message?.roomId;
      if (!roomId) return;
      updateChatRoomFromMessage(message);
      if (message.isNotifyRoomChat === false) return;
      updateLastMessage(roomId, message);
    });

    connection.off("GroupChatCreated");
    connection.on("GroupChatCreated", () => {
      refetchRef.current?.();
    });
    connection.off("UserVsUserChatCreated");
    connection.on("UserVsUserChatCreated", (msg: any) => {
      log("UserVsUserChatCreated:", msg);
      refetchRef.current?.();
    });

    connection.off("RoomChatUpdated");
    connection.on("RoomChatUpdated", (msg: any) => {
      console.log("RoomChatUpdated")
      refetchUserChatRooms();
    });
    connection.off("GroupChatRemoved");
    connection.on("GroupChatRemoved", (msg: any) => {
      refetchUserChatRooms();
    });
    connection.off("RoomChatAndFriendRequestReceived");
    connection.on("RoomChatAndFriendRequestReceived", (m: any) => {
      const current = useSocialChatStore.getState().notificationCounts;
      const next = {
        userId: m?.userId || 0,
        unreadRoomsCount: m?.unreadRoomsCount || 0,
        pendingFriendRequestsCount: m?.pendingFriendRequestsCount || 0,
      };
      if (
        current.userId !== next.userId ||
        current.unreadRoomsCount !== next.unreadRoomsCount ||
        current.pendingFriendRequestsCount !== next.pendingFriendRequestsCount
      ) {
        setNotificationCounts(next);
        log("Updated notification counts:", next);
      }
    });
    connection.off("GroupChatRemoved");
    connection.on("GroupChatRemoved", (m: any) => {
      refetchRef.current?.();
    });
    const handleUnread = (d: any) => {
      const chatCode = d?.chatCode;
      if (!chatCode) return;
      const my = d?.allUnreadCounts?.[String(user?.id)] ?? 0;
      if (lastUnreadRef.current[chatCode] === my) return;
      lastUnreadRef.current[chatCode] = my;
      setRoomUnread(chatCode, my);
      if (enableDebugLogs) log(`Unread ${chatCode}: -> ${my}`);
    };
    connection.off("UnreadCountChanged");
    connection.on("UnreadCountChanged", handleUnread);

    connection.onreconnecting((err) => {
      isConnectedRef.current = false;
      log("Reconnecting...", err);
    });

    connection.onreconnected(async (id) => {
      isConnectedRef.current = true;
      joinedUserNotifyRef.current = false;
      log("Reconnected:", id);
      await joinUserNotify();
      if (activeRoomsRef.current.length) await joinChatRooms(activeRoomsRef.current);
    });

    connection.onclose((err) => {
      isConnectedRef.current = false;
      joinedUserNotifyRef.current = false;
      log("Closed:", err);
    });
  }, [
    enableDebugLogs,
    joinChatRooms,
    joinUserNotify,
    log,
    setRoomUnread,
    updateChatRoomFromMessage,
    updateLastMessage,
    user?.id,
    setNotificationCounts,
  ]);

  const connect = useCallback(async () => {
    const curr = connectionRef.current;
    if (curr) {
      const s = curr.state;
      if (
        s === signalR.HubConnectionState.Connected ||
        s === signalR.HubConnectionState.Connecting ||
        s === signalR.HubConnectionState.Reconnecting
      ) {
        return startPromiseRef.current ?? Promise.resolve();
      }
    }
    if (connectingRef.current) {
      return startPromiseRef.current ?? Promise.resolve();
    }

    const conn = buildConnection();
    connectionRef.current = conn;
    attachHandlers(conn);

    connectingRef.current = true;
    const p = conn
      .start()
      .then(async () => {
        isConnectedRef.current = true;
        startedRef.current = true;
        log("Connected:", conn.connectionId);
        await joinUserNotify();
        if (activeRoomsRef.current.length) await joinChatRooms(activeRoomsRef.current);
      })
      .finally(() => {
        connectingRef.current = false;
      });

    startPromiseRef.current = p;
    return p;
  }, [attachHandlers, buildConnection, joinChatRooms, joinUserNotify, log]);

  const stop = useCallback(async () => {
    const conn = connectionRef.current;
    if (!conn) return;
    try {
      await conn.stop();
    } finally {
      connectionRef.current = null;
      isConnectedRef.current = false;
      startedRef.current = false;
      joinedUserNotifyRef.current = false;
      activeRoomsRef.current = [];
      joinedRoomsRef.current.clear();
      lastUnreadRef.current = {};
      log("Stopped");
    }
  }, [log]);

  useEffect(() => {
    if (autoConnect && isAuthenticated && !startedRef.current) {
      void connect();
    }
    return () => { void stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect, isAuthenticated]);

  useEffect(() => {
    if (!isConnectedRef.current) {
      activeRoomsRef.current = roomIds.slice();
      return;
    }
    const current = Array.from(joinedRoomsRef.current);
    const toJoin = roomIds.filter(id => !joinedRoomsRef.current.has(id));
    const toLeave = current.filter(id => !roomIds.includes(id));
    if (toLeave.length) void leaveChatRooms(toLeave);
    if (toJoin.length) void joinChatRooms(toJoin);
    activeRoomsRef.current = roomIds.slice();
  }, [roomIds, joinChatRooms, leaveChatRooms]);

  useEffect(() => {
    const onOnline = () => {
      if (connectionRef.current?.state === signalR.HubConnectionState.Disconnected) void connect();
    };
    const onVisible = () => {
      if (
        document.visibilityState === "visible" &&
        connectionRef.current?.state === signalR.HubConnectionState.Disconnected
      ) {
        void connect();
      }
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [connect]);

  return {
    startConnection: connect,
    stopConnection: stop,
    isConnected: isConnectedRef.current,
    joinedRooms: Array.from(joinedRoomsRef.current),
    activeRooms: activeRoomsRef.current,
    connectionId: connectionRef.current?.connectionId,
  };
}
