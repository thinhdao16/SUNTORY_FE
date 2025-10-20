import httpClient from "@/config/http-client";

export const updateNewDevice = async (payload: any) => {
    const res = await httpClient.put("/api/v1/device/update-new-device", payload);
    return res.data;
};