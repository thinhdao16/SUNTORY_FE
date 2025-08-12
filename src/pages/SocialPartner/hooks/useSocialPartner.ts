import {
    acceptFriendRequest,
    cancelFriendRequest,
    getFriendshipFriends,
    getFriendshipReceivedRequests,
    rejectFriendRequest,
    searchFriendshipUsers,
    sendFriendRequest,
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

export const useFriendshipFriends = (pageSize = 10) => {
    return useInfiniteQuery(
        ["friendshipFriends"],
        ({ pageParam = 0 }) => getFriendshipFriends(pageParam, pageSize),
        {
            getNextPageParam: (lastPage, allPages) => {
                if (lastPage.length < pageSize) return undefined;
                return allPages.length;
            },
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
            showToast("Đã gửi lời mời kết bạn.", 1000, "success");
            queryClient.invalidateQueries(["searchFriendshipUsers"]);
            onSuccessCallback?.();
        },
        onError: () => showToast("Không thể gửi lời mời.", 1000, "error"),
    });
};

export const useCancelFriendRequest = (
    showToast: any,
    onSuccessCallback?: () => void
) => {
    const queryClient = useQueryClient();

    return useMutation((requestId: number) => cancelFriendRequest(requestId), {
        onSuccess: () => {
            showToast("Đã hủy lời mời kết bạn.", 1000, "success");
            queryClient.invalidateQueries(["searchFriendshipUsers"]);
            onSuccessCallback?.();
        },
        onError: () => showToast("Hủy lời mời thất bại.", 1000, "error"),
    });
};

export const useAcceptFriendRequest = (
    showToast: any,
    onSuccessCallback?: () => void
) => {
    const queryClient = useQueryClient();

    return useMutation((requestId: number) => acceptFriendRequest(requestId), {
        onSuccess: () => {
            showToast("Đã chấp nhận lời mời kết bạn.", 1000, "success");
            queryClient.invalidateQueries(["searchFriendshipUsers"]);
            queryClient.invalidateQueries(["friendshipReceivedRequests"]);

            onSuccessCallback?.();
        },
        onError: () => showToast("Không thể chấp nhận.", 1000, "error"),
    });
};

export const useRejectFriendRequest = (
    showToast: any,
    onSuccessCallback?: () => void
) => {
    const queryClient = useQueryClient();

    return useMutation((requestId: number) => rejectFriendRequest(requestId), {
        onSuccess: () => {
            showToast("Đã từ chối lời mời kết bạn.", 1000, "success");
            queryClient.invalidateQueries(["searchFriendshipUsers"]);
            queryClient.invalidateQueries(["friendshipReceivedRequests"]);
            onSuccessCallback?.();
        },
        onError: () => showToast("Không thể từ chối.", 1000, "error"),
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