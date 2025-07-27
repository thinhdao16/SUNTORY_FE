// React Query hooks
import { deleteAllTranslations, deleteTranslationById, fetchTranslationById, fetchTranslationHistory, TranslationHistoryItem } from "@/services/translation/translation-service";
import { useQuery, useMutation, useQueryClient } from "react-query";

export const useTranslationHistory = (pageNumber = 0, pageSize = 10) => {
    return useQuery(
        ["translation-history", pageNumber, pageSize],
        () => fetchTranslationHistory(pageNumber, pageSize),
        {
            keepPreviousData: true,
            staleTime: 0,
        }
    );
};

export const useTranslationById = (id: number) => {
    return useQuery<TranslationHistoryItem, Error>(
        ["translation-history", id],
        () => fetchTranslationById(id),
        {
            enabled: !!id,
        }
    );
};

export const useDeleteTranslation = () => {
    const queryClient = useQueryClient();
    return useMutation((id: number) => deleteTranslationById(id), {
        onSuccess: () => {
            queryClient.invalidateQueries("translation-history");
        },
    });
};
export const useDeleteAllTranslations = () => {
    const queryClient = useQueryClient();
    return useMutation(() => deleteAllTranslations(), {
        onSuccess: () => {
            queryClient.invalidateQueries("translation-history");
            queryClient.setQueryData("translation-history", []);
        },
    });
};
