import httpClient from '@/config/http-client';

export interface ListNotificationParams {

    pageNumber: number;
    pageSize: number;
}

export interface ReadNotificationParams {
    ids: number[];
}

export interface DeleteNotificationParams {
    id: number;
}

export interface Notification {
    id: number;
    code: string;
    userId: number;
    actorId: number;
    actorName: string;
    actorAvatar: string;
    postId?: number | null;
    postCode?: string | null;
    commentId?: number | null;
    isRead: boolean;
    type: number;
    status: number;
    createDate: string;
}

export interface ListNotificationResponse {
    data: Notification[];
}

export const listNotificationApi = async (payload: ListNotificationParams) => {
    const res = await httpClient.get("/api/v1/social-notification/list", { params: payload });
    return res.data;
};

export const readNotificationApi = async (payload: ReadNotificationParams) => {
    const res = await httpClient.put("/api/v1/social-notification/seen", payload);
    return res.data;
};

export const deleteNotificationApi = async (payload: DeleteNotificationParams) => {
    const res = await httpClient.delete("/api/v1/social-notification/delete", { data: payload });
    return res.data;
};
