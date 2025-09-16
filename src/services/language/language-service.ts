import httpClient from "@/config/http-client";

export async function getListLanguage() {
    const res = await httpClient.get<any>("/api/v1/language/list");
    return res.data;
}