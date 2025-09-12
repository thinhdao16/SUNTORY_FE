import httpClient from "@/config/http-client";
import { UpdateHealthConditionV2Payload } from "./heath-types";

export const getHealthMasterData = async () => {
  const res = await httpClient.get("/api/v1/health/all-data");
  return res.data.data;
};