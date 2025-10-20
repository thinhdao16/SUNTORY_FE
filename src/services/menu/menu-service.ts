import httpClient from "@/config/http-client";
import { DietStyleResponse, MenuAnalyzingResponse } from "./menu-types";


export const getDietStyle = async () => {
    const response = await httpClient.get<DietStyleResponse>("/api/v1/health/lifestyles");
    return response.data;
};

export const menuAnalyzing = async (formData: FormData) => {
    const response = await httpClient.post<MenuAnalyzingResponse>("/api/v1/menu-translation/create-translation", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

export const getMenuFoodList = async (menuId: number, page: number, pageSize: number) => {
    const response = await httpClient.get<any>(`/api/v1/food/list-food?historyId=${menuId}&pageNumber=${page}&pageSize=${pageSize}`);
    return response.data;
};