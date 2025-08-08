import { useCallback, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTranslationStore } from "@/store/zustand/translation-store";
import { useDeleteAllTranslations, useDeleteTranslation, useTranslationHistory } from "./useTranslationHistory";
import { EmotionItem, TranslationHistoryItem } from "@/types/translate-history";
import { getEmotionIcon, groupHistoryByDate } from "@/utils/translate-utils";
import { useToastStore } from "@/store/zustand/toast-store";

const PAGE_SIZE = 20;

export const useTranslateHistoryLogic = () => {
    const { t, i18n } = useTranslation();
    const history = useHistory();
    const [page, setPage] = useState(0);
    const [swipeThreshold, setSwipeThreshold] = useState(0);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const moreMenuRef = useRef<HTMLDivElement>(null);
    const { data, isLoading, isFetching, isPreviousData } = useTranslationHistory(page, PAGE_SIZE);
    const containerRef = useRef<HTMLDivElement>(null);
    const {
        history: historyItems,
        addToHistory,
        clearHistory,
        setCurrentResult,
        setEmotionData,
        setInputValueTranslate
    } = useTranslationStore();
    const deleteTranslationMutation = useDeleteTranslation();
    const deleteAllMutation = useDeleteAllTranslations();
    const showToast = useToastStore.getState().showToast;

    const EMOTIONS: EmotionItem[] = [
        { label: t("Happy"), icon: "😊" },
        { label: t("Sad"), icon: "😢" },
        { label: t("Angry"), icon: "😡" },
        { label: t("Love"), icon: "😍" },
        { label: t("Afraid"), icon: "😱" },
    ];

    const handleScroll = useCallback(() => {
        const el = containerRef.current;
        if (!el || isFetching || isPreviousData) return;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
            if (data?.nextPage) setPage((prev) => prev + 1);
        }
    }, [data, isFetching, isPreviousData]);

    const handleHistoryItem = useCallback((item: TranslationHistoryItem) => {
        setCurrentResult({
            id: item.id,
            code: item.code,
            originalText: item.originalText,
            translatedText: item.translatedText || t("No translation available"),
            reverseTranslation: item.reverseTranslation || t("No reverse translation available"),
            aiReviewInsights: item.aiReviewInsights || t("No AI review insights available"),
            fromLanguageId: item.fromLanguageId,
            toLanguageId: item.toLanguageId,
            context: item.context ?? null,
            emotionType: item.emotionType ?? null,
            timestamp: item.createDate,
        });

        setInputValueTranslate({
            input: item.originalText,
            output: item.translatedText,
        });

        if (!item.emotionType && !item.context) {
            setEmotionData(null);
        } else {
            setEmotionData({
                emotions: item.emotionType
                    ? item.emotionType.split(",").map((label: string) => ({
                        label: label.trim(),
                        icon: getEmotionIcon(label.trim(), EMOTIONS)
                    }))
                    : [],
                context: item.context
                    ? item.context.split(",").map((c: string) => c.trim()).filter(Boolean)
                    : [],
            });
        }

        history.replace("/translate", { history: true });
    }, [setCurrentResult, setInputValueTranslate, setEmotionData, t, EMOTIONS, history]);

    const handleDelete = useCallback(async (itemId: number) => {
        try {
            await deleteTranslationMutation.mutateAsync(itemId);
            useTranslationStore.setState((state) => ({
            history: state.history.filter((item) => item.id !== itemId)
            }));
        } catch (error) {
            console.error("Delete failed:", error);
        }
    }, [deleteTranslationMutation]);

    const handleDeleteAllTranslations = async () => {
        setShowMoreMenu(false);
        if (historyItems.length === 0) {
            showToast(t("No translations to delete"), 3000, "info");
            return;
        }
        try {
            await deleteAllMutation.mutateAsync();
            clearHistory()
            showToast(t("All translations deleted successfully"), 3000, "success");
        } catch (error) {
            showToast(t("Failed to delete all translations"), 3000, "error");
        }
    };
    const handleSwipeProgress = useCallback((progress: number) => {
        setSwipeThreshold(progress);
    }, []);

    const handleSwipeEnd = useCallback((item: TranslationHistoryItem) => {
        if (swipeThreshold > 75) {
            const el = document.getElementById(`delete-swipe-${item.id}`);
            el?.click();
            // handleDelete(item.id);
        }
    }, [swipeThreshold, handleDelete]);

    const handleBack = useCallback(() => {
        history.replace("/translate", { history: true });
    }, [history]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.addEventListener("scroll", handleScroll);
        return () => el.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    useEffect(() => {
        if (page === 0) clearHistory();
    }, [page, clearHistory]);

    useEffect(() => {
        if (data?.data?.length) {
            addToHistory(data.data);
        }
    }, [data, addToHistory]);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
                setShowMoreMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    const groupedHistory = groupHistoryByDate(historyItems, t, i18n.language);

    return {
        containerRef,
        isLoading,
        isFetching,
        groupedHistory,
        handleHistoryItem,
        handleDelete,
        handleSwipeProgress,
        handleSwipeEnd,
        handleBack,
        t,
        showMoreMenu,
        setShowMoreMenu,
        moreMenuRef,
        handleDeleteAllTranslations
    };
};