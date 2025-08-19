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
export const createFriendshipByCodeRequest = async (payload: CreateFriendshipByCodePayload) => {
  const res = await httpClient.post("/api/v1/friendship/send-request-by-code", payload);
  return res.data.data;
};
export const searchFriendshipUsers = async (params: SearchFriendshipUserParams) => {
  const res = await httpClient.get("/api/v1/friendship/users", { params });
  return res.data.data.data;
};
export const getFriendshipFriends = async (page: number, pageSize: number) => {
  const res = await httpClient.get("/api/v1/friendship/friends", {
    params: {
      PageNumber: page,
      PageSize: pageSize,
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
}
export const unfriend = async (friendUserId: number) => {
  const res = await httpClient.post("/api/v1/friendship/unfriend", { friendUserId });
  return res.data.data;
};