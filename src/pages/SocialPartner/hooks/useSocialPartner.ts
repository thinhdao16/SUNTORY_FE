import {
    acceptFriendRequest,
    cancelFriendRequest,
    getFriendshipFriends,
    getFriendshipReceivedRequests,
    rejectFriendRequest,
    searchFriendshipUsers,
    sendFriendRequest,
    unfriend,
} from "@/services/social/social-partner-service";
import { useInfiniteQuery, useMutation, useQueryClient } from "react-query";

export const useSearchFriendshipUsers = (keyword: string, pageSize = 10) => {
    return useInfiniteQuery(
        ["searchFriendshipUsers", keyword],
        ({ pageParam = 0 }) =>
            searchFriendshipUsers({
                keyword,
                PageNumber: pageParam,
                PageSize: pageSize,
            }),
        {
            getNextPageParam: (lastPage, allPages) => {
                if (lastPage.length < pageSize) return undefined;
                return allPages.length;
            },
            enabled: !!keyword,
        }
    );
};

export const useFriendshipFriendsWithSearch = (
    limit: number = 20,
    searchQuery?: string
) => {
    return useInfiniteQuery(
        ["friendshipFriends", searchQuery], 
        ({ pageParam = 0 }) => getFriendshipFriends(pageParam, limit, searchQuery),
        {
            getNextPageParam: (lastPage, pages) => {
                const hasMore = lastPage?.length === limit;
                return hasMore ? pages.length + 1 : undefined;
            },
            enabled: true,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000, 
        }
    );
};

export const useSendFriendRequest = (
    showToast: any,
    onSuccessCallback?: () => void
) => {
    const queryClient = useQueryClient();

    return useMutation((userId: number) => sendFriendRequest(userId), {
        onSuccess: () => {
            showToast(t("Friend request sent."), 1000, "success");
            queryClient.invalidateQueries(["searchFriendshipUsers"]);
            onSuccessCallback?.();
        },
        onError: () => showToast(t("Unable to send invitation."), 1000, "error"),
    });
};

export const useCancelFriendRequest = (
    showToast: any,
    onSuccessCallback?: () => void
) => {
    const queryClient = useQueryClient();

    return useMutation((requestId: number) => cancelFriendRequest(requestId), {
        onSuccess: () => {
            showToast(t("Friend request canceled."), 1000, "error");
            queryClient.invalidateQueries(["searchFriendshipUsers"]);
            onSuccessCallback?.();
        },
        onError: () => showToast(t("Failed to cancel friend request."), 1000, "error"),
    });
};

export const useAcceptFriendRequest = (
    showToast: any,
    onSuccessCallback?: () => void
) => {
    const queryClient = useQueryClient();

    return useMutation((requestId: number) => acceptFriendRequest(requestId), {
        onSuccess: () => {
            showToast(t("Friend request accepted."), 1000, "success");
            queryClient.invalidateQueries(["searchFriendshipUsers"]);
            queryClient.invalidateQueries(["friendshipReceivedRequests"]);

            onSuccessCallback?.();
        },
        onError: () => showToast(t("Unacceptable."), 1000, "error"),
    });
};

export const useRejectFriendRequest = (
    showToast: any,
    onSuccessCallback?: () => void
) => {
    const queryClient = useQueryClient();

    return useMutation((requestId: number) => rejectFriendRequest(requestId), {
        onSuccess: () => {
            showToast(t("Friend request rejected."), 1000, "error");
            queryClient.invalidateQueries(["searchFriendshipUsers"]);
            queryClient.invalidateQueries(["friendshipReceivedRequests"]);
            onSuccessCallback?.();
        },
        onError: () => showToast(t("Unable to reject."), 1000, "error"),
    });
};

export const useFriendshipReceivedRequests = (pageSize = 20) => {
    return useInfiniteQuery(
        ["friendshipReceivedRequests"],
        ({ pageParam = 0 }) => getFriendshipReceivedRequests(pageParam, pageSize),
        {
            getNextPageParam: (lastPage, allPages) => {
                if (lastPage.length < pageSize) return undefined;
                return allPages.length;
            },
        }
    );
};
export const useUnfriend = (
    showToast: (msg: string, dur?: number, type?: "success" | "error" | "warning") => void,
    refetchRoomData?: () => void // (tuỳ) bạn đang có refetch ở useChatRoomByCode
) => {
    const queryClient = useQueryClient();

    return useMutation(
        ({ friendUserId, roomCode }: { friendUserId: number; roomCode?: string }) =>
            unfriend(friendUserId),
        {
            onSuccess: (_data, variables) => {
                showToast(t("Unfriended successfully."), 1200, "success");

                // reload các list liên quan
                queryClient.invalidateQueries(["friendshipFriends"]);
                queryClient.invalidateQueries(["friendshipReceivedRequests"]);
                if (variables.roomCode) {
                    queryClient.invalidateQueries(["chatRoom", variables.roomCode]);
                }
                // nếu bạn truyền vào refetch từ useChatRoomByCode
                refetchRoomData?.();
            },
            onError: () => {
                showToast(t("Unable to unfriend."), 1500, "error");
            },
        }
    );
};