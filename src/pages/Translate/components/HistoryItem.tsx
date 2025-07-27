import React from "react";
import { SwipeableListItem, SwipeAction, TrailingActions } from 'react-swipeable-list';
import { IoTrashOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import { TranslationHistoryItem } from "@/types/translate-history";

interface HistoryItemProps {
    item: TranslationHistoryItem;
    onItemClick: (item: TranslationHistoryItem) => void;
    onDelete: (itemId: number) => void;
    onSwipeProgress: (progress: number) => void;
    onSwipeEnd: (item: TranslationHistoryItem) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({
    item,
    onItemClick,
    onDelete,
    onSwipeProgress,
    onSwipeEnd,
}) => {
    const { t } = useTranslation();

    const trailingActions = (
        <TrailingActions>
            <SwipeAction
                Tag="div"
                destructive
                onClick={() => onDelete(item.id)}
            >
                <div className="bg-red-500 text-white w-[70px]" id={`delete-swipe-${item.id}`}>
                    <div className="flex items-center justify-center h-full">
                        <IoTrashOutline className="text-2xl" />
                    </div>
                </div>
            </SwipeAction>
        </TrailingActions>
    );

    return (
        <SwipeableListItem
            actionDelay={200}
            trailingActions={trailingActions}
            threshold={0.75}
            onSwipeProgress={onSwipeProgress}
            onSwipeEnd={() => onSwipeEnd(item)}
        >
            <div
                className="bg-white border-b-[0.5px] border-neutral-200 py-3 mx-6 w-full"
                onClick={() => onItemClick(item)}
            >
                <div
                    className="text-black text-base line-clamp-2"
                    style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {item.originalText}
                </div>
                <div
                    className="text-gray-600 text-base line-clamp-2"
                    style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {item.translatedText || t("No translation available")}
                </div>
            </div>
        </SwipeableListItem>
    );
};

export default HistoryItem;