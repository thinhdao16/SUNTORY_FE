import httpClient from "@/config/http-client";

export const getHealthMasterData = async () => {
  const res = await httpClient.get("/api/v1/health/all-data");
  return res.data.data;
};