import httpClient from "@/config/http-client";

export const getHealthMasterData = async () => {
  const res = await httpClient.get("/api/health/master-data");
  return res.data.data;
};