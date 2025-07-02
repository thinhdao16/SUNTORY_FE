import { useQuery } from "react-query";
import { getHealthMasterData } from "@/services/health/health-service";
import { useHealthMasterDataStore } from "@/store/zustand/health-master-data-store";

export const useHealthMasterData = () => {
    const setMasterData = useHealthMasterDataStore((s) => s.setMasterData);

    return useQuery(
        "healthMasterData",
        getHealthMasterData,
        {
            onSuccess: (data) => {
                setMasterData(data);
            },
            staleTime: 1000 * 60 * 60,
        }
    );
};