import React, { useState, useRef, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import BackIcon from "@/icons/logo/vector_left.svg?react";
import MoreIcon from "@/icons/logo/more.svg?react";
import DeleteIcon from "@/icons/logo/trash.svg?react";
import HistoryGroup from "./components/HistoryGroup";
import { useTranslateHistoryLogic } from "./hooks/useTranslateHistoryLogic";
import styles from "./Translate.module.css";

const TranslateHistory: React.FC = () => {
  const isNative = Capacitor.isNativePlatform();

  const {
    containerRef,
    isLoading,
    isFetching,
    groupedHistory,
    handleHistoryItem,
    handleDelete,
    handleSwipeProgress,
    handleSwipeEnd,
    handleBack,
    handleDeleteAllTranslations,
    showMoreMenu,
    setShowMoreMenu,
    moreMenuRef,
    t,
  } = useTranslateHistoryLogic();

  return (
    <div className="bg-white min-h-screen pt-4">
      <div className="flex items-center justify-between mb-4 px-6">
        <button onClick={handleBack}>
          <BackIcon />
        </button>
        <span className="font-semibold text-main uppercase tracking-wide">
          {t("History Translate")}
        </span>
        <div className="relative" ref={moreMenuRef}>
          <button onClick={() => setShowMoreMenu(!showMoreMenu)}>
            <MoreIcon />
          </button>

          <div
            className={`absolute right-0 top-8 bg-white rounded-lg shadow-lg z-50 transform transition-all duration-300 ease-out origin-top-right ${
              showMoreMenu
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            <button
              onClick={handleDeleteAllTranslations}
              className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 rounded-lg"
            >
              <span className="font-semibold text-neutral-500 whitespace-nowrap truncate">
                {t("Delete all translations")}
              </span>
              <DeleteIcon />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`${styles["translate-history-container"]} pb-10 ${
          isNative
            ? "max-h-[85vh]"
            : "max-h-[75vh] lg:max-h-[75vh] xl:max-h-[85vh]"
        }`}
      >
        {isLoading && (
          <div className="flex justify-center items-center py-8 px-6">
            <div className="loader border-blue-600 border-t-transparent border-4 rounded-full w-8 h-8 animate-spin"></div>
          </div>
        )}

        {groupedHistory.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 py-8 px-6">
            {t("No history found")}
          </div>
        )}

        {groupedHistory.map((group, index) => (
          <HistoryGroup
            key={group.label}
            group={group}
            onItemClick={handleHistoryItem}
            onDelete={handleDelete}
            onSwipeProgress={handleSwipeProgress}
            onSwipeEnd={handleSwipeEnd}
            index={index}
          />
        ))}

        {isFetching && (
          <div className="flex justify-center items-center py-4">
            <div className="loader border-blue-600 border-t-transparent border-4 rounded-full w-6 h-6 animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslateHistory;
