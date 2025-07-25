export interface TranslationHistoryItem {
  id: number;
  code: string;
  originalText: string;
  translatedText: string;
  reverseTranslation?: string;
  aiReviewInsights?: string;
  fromLanguageId: number | null;
  toLanguageId: number;
  context?: string | null;
  emotionType?: string | null;
  createDate: string;
}

export interface HistoryGroup {
  label: string;
  items: TranslationHistoryItem[];
}

export interface EmotionItem {
  label: string;
  icon: string;
}