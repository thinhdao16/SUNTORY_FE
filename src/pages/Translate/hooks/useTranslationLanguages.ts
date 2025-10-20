// src/hooks/useTranslation.ts
import { useMutation, useQuery } from "react-query";
import { 
  fetchTranslationLanguages, 
  createTranslation, 
  TranslationLanguage,
  CreateTranslationRequest,
  CreateTranslationResponse, 
  createTranslationChat
} from "@/services/translation/translation-service";

export const useTranslationLanguages = () => {
  return useQuery<TranslationLanguage[], Error>(
    "translation-languages",
    fetchTranslationLanguages,
    {
      staleTime: 1000 * 60 * 30, // 30 minutes
      cacheTime: 1000 * 60 * 60, // 1 hour
      refetchOnWindowFocus: false,
    }
  );
};

export const useCreateTranslation = () => {
  return useMutation<CreateTranslationResponse, Error, CreateTranslationRequest>(
    createTranslation,
    {
      onSuccess: (data) => {
        console.log("Translation created successfully:", data);
      },
      onError: (error) => {
        console.error("Translation creation failed:", error);
      },
    }
  );
};
export const useCreateTranslationChat = () => {
  return useMutation<CreateTranslationResponse, Error, { toLanguageId: number, originalText: string }>(
    createTranslationChat,
    {
      onSuccess: (data) => {
      },
      onError: (error) => {
        console.error("Translation creation failed:", error);
      },
    }
  );
};