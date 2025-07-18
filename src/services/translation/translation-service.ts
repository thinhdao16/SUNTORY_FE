// src/services/translation/translation-service.ts
import httpClient from "@/config/http-client";

export interface TranslationLanguage {
  name: string;
  nativeName: string;
  orderView: number;
  id: number;
  code: string;
  organizationId: string | null;
  status: number;
  createDate: string;
  createUser: number;
  createUserFirstName: string | null;
  createUserLastName: string | null;
  createUserName: string;
  updateDate: string | null;
  updateUser: number;
  updateUserFirstName: string | null;
  updateUserLastName: string | null;
  updateUserName: string;
  deleteDate: string | null;
  deleteUser: number;
  deleteUserFirstName: string | null;
  deleteUserLastName: string | null;
  deleteUserName: string;
}

export interface TranslationLanguagesResponse {
  result: number;
  errors: string | null;
  message: string | null;
  data: TranslationLanguage[];
}

export interface CreateTranslationRequest {
  fromLanguageId: number | null;
  toLanguageId: number | null;
  originalText: string;
  context: string | null;
  emotionType: string | null;
}

export interface CreateTranslationResponse {
  result: number;
  errors: string | null;
  message: string | null;
  data: {
    translatedText: string;
    originalText: string;
    fromLanguage: string | null;
    toLanguage: string;
    context?: string | null;
    emotionType?: string | null;
    reverseTranslation?: string | null;
    aiReviewInsights?: string | null;
    fromLanguageId?: number | null;
    toLanguageId?: number | null;
  };
}

export const fetchTranslationLanguages = async (): Promise<TranslationLanguage[]> => {
  const response = await httpClient.get<TranslationLanguagesResponse>(
    "/api/v1/translation/translation-languages"
  );
  return response.data.data || [];
};

export const createTranslation = async (payload: CreateTranslationRequest): Promise<CreateTranslationResponse> => {
  const response = await httpClient.post<CreateTranslationResponse>(
    "/api/v1/translation/create",
    payload
  );
  return response.data;
};