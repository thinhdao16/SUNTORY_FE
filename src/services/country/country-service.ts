import httpClient from "@/config/http-client";
import { CountryResponse } from "./country-type";

export async function getListCountry() {
    const res = await httpClient.get<CountryResponse>("/api/v1/country/list");
    return res.data;
}