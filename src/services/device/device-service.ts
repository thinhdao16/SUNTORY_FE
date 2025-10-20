import httpClient from "@/config/http-client";
import { UpdateDeviceLanguagePayload } from "./device-type";

export const updateNewDevice = async (payload: any) => {
    const res = await httpClient.put("/api/v1/device/update-new-device", payload);
    return res.data;
};

export const updateDeviceLanguage = async (payload: UpdateDeviceLanguagePayload) => {
    const res = await httpClient.put(`/api/v1/device/device-language`, payload);
    return res.data;
};