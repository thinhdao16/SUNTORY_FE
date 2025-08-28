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
    translated_text?:string
  };
}

export interface TranslationHistoryItem {
  id: number;
  originalText: string;
  translatedText: string;
  fromLanguageId: number | null;
  toLanguageId: number;
  context?: string | null;
  emotionType?: string | null;
  reverseTranslation?: string | null;
  aiReviewInsights?: string | null;
  timestamp?: string;
}

export interface TranslationHistoryResponse {
  result: number;
  errors: string | null;
  message: string | null;
  data: TranslationHistoryItem[];
}

export interface TranslationHistoryPaged {
  pageNumber: number;
  pageSize: number;
  firstPage: number;
  lastPage: number;
  totalPages: number;
  totalRecords: number;
  nextPage: boolean;
  previousPage: boolean;
  data: TranslationHistoryItem[];
}

export interface TranslationHistoryPagedResponse {
  result: number;
  errors: string | null;
  message: string | null;
  data: TranslationHistoryPaged;
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
export const createTranslationChat = async (payload: { toLanguageId: number, originalText: string }): Promise<CreateTranslationResponse> => {
  const response = await httpClient.post<CreateTranslationResponse>(
    "/api/v1/translation/chat",
    payload
  );
  return response.data;
};

export const fetchTranslationHistory = async (
  pageNumber = 0,
  pageSize = 10
): Promise<TranslationHistoryPaged> => {
  const response = await httpClient.get<TranslationHistoryPagedResponse>(
    `/api/v1/translation/history?PageNumber=${pageNumber}&PageSize=${pageSize}`
  );
  return response.data.data;
};

export const fetchTranslationById = async (id: number): Promise<TranslationHistoryItem> => {
  const response = await httpClient.get<{ data: TranslationHistoryItem }>(
    `/api/v1/translation/history/${id}`
  );
  return response.data.data;
};

export const deleteTranslationById = async (id: number): Promise<void> => {
  await httpClient.delete(`/api/v1/translation/${id}`);
};

export const deleteAllTranslations = async (): Promise<void> => {
  await httpClient.delete("/api/v1/translation/all");
};