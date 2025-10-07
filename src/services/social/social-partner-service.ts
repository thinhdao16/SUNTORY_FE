import httpClient from "@/config/http-client";

export interface CreateFriendshipByCodePayload {
  toUserCode: string;
  inviteMessage: string;
}
export interface SearchFriendshipUserParams {
  keyword?: string;
  SortBy?: string;
  SortOrder?: string;
  PageNumber: number;
  PageSize: number;
}
export interface PaginatedResponse<T> {
  pageNumber: number;
  pageSize: number;
  firstPage: number;
  lastPage: number;
  totalPages: number;
  totalRecords: number;
  nextPage: boolean;
  previousPage: boolean;
  data: T[];
}
export const createFriendshipByCodeRequest = async (payload: CreateFriendshipByCodePayload) => {
  const res = await httpClient.post("/api/v1/friendship/send-request-by-code", payload);
  return res.data.data;
};
export const searchFriendshipUsers = async (params: SearchFriendshipUserParams) => {
  const res = await httpClient.get("/api/v1/friendship/users", { params });
  return res.data.data.data;
};
export const getFriendshipFriends = async ( page: number = 0, 
    limit: number = 20,
    search?: string) => {
  const res = await httpClient.get("/api/v1/friendship/friends", {
    params: {
      PageNumber: page,
      PageSize: limit,
      keyword: search,
    },
  });
  return res.data.data.data;
};

export const getFriendsExcludeRoom = async (roomChatCode: string, page: number = 0,
    limit: number = 20,
    search?: string) => {
  const res = await httpClient.get("/api/v1/chat-user/chatroom/friends-exclude-room", {
    params: {
      PageNumber: page,
      PageSize: limit,
      keyword: search,
      roomChatCode: roomChatCode
    },
  });
  return res.data.data.data;
};
export const getFriendshipReceivedRequests = async (page: number, pageSize: number) => {
  const res = await httpClient.get("/api/v1/friendship/received-requests", {
    params: {
      PageNumber: page,
      PageSize: pageSize,
    },
  });
  return res.data.data.data;
};
export const getFriendshipReceivedRequestsv2 = async (page: number, pageSize: number) => {
  const res = await httpClient.get("/api/v1/friendship/received-requests", {
    params: {
      PageNumber: page,
      PageSize: pageSize,
    },
  });
  return res.data.data;
};
export const sendFriendRequest = async (toUserId: number) => {
  const res = await httpClient.post("/api/v1/friendship/send-request", { toUserId, inviteMessage: "" });
  return res.data.data;
}
export const cancelFriendRequest = async (friendRequestId: number) => {
  const res = await httpClient.post("/api/v1/friendship/cancel-request", { friendRequestId });
  return res.data.data;
};
export const acceptFriendRequest = async (friendRequestId: number) => {
  const res = await httpClient.post("/api/v1/friendship/accept-request", { friendRequestId });
  return res.data.data;
}
export const rejectFriendRequest = async (friendRequestId: number) => {
  const res = await httpClient.post("/api/v1/friendship/reject-request", { friendRequestId });
  return res.data.data;
};
export const unfriend = async (friendUserId: number) => {
  const res = await httpClient.post("/api/v1/friendship/unfriend", { friendUserId });
  return res.data.data;
};

export const getListSentRequests = async (page: number, pageSize: number) => {
  const res = await httpClient.get("/api/v1/friendship/sent-requests", {
    params: {
      PageNumber: page,
      PageSize: pageSize,
    },
  });
  return res.data.data.data;
};

export const getFriendshipRecommended = async (
  page: number = 0,
  pageSize: number = 10
) => {
  const res = await httpClient.get("/api/v1/friendship/recommended", {
    params: {
      PageNumber: page,
      PageSize: pageSize,
    },
  });
  const payload = res?.data?.data;
  return Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
};

// Paginated variant to support infinite scrolling
export const getFriendshipRecommendedPaged = async (
  page: number = 0,
  pageSize: number = 10
): Promise<PaginatedResponse<any>> => {
  const res = await httpClient.get("/api/v1/friendship/recommended", {
    params: {
      PageNumber: page,
      PageSize: pageSize,
    },
  });
  return res.data.data as PaginatedResponse<any>;
};