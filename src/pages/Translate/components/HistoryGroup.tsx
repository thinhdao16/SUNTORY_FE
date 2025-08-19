import React from "react";
import { SwipeableList, Type as ListType } from 'react-swipeable-list';
import "react-swipeable-list/dist/styles.css";
import { HistoryGroup as HistoryGroupType, TranslationHistoryItem } from "@/types/translate-history";
import HistoryItem from "./HistoryItem";
import styles from "../Translate.module.css";

interface HistoryGroupProps {
    group: HistoryGroupType;
    onItemClick: (item: TranslationHistoryItem) => void;
    onDelete: (itemId: number) => void;
    onSwipeProgress: (progress: number) => void;
    onSwipeEnd: (item: TranslationHistoryItem) => void;
    index: number
}

const HistoryGroup: React.FC<HistoryGroupProps> = ({
    group,
    onItemClick,
    onDelete,
    onSwipeProgress,
    onSwipeEnd,
    index
}) => {
    return (
        <div className={`${styles["group-section"]} ${index === 0 ? "mt-0" : "mt-10"}`}>
            <div
                className={`text-main font-bold text-sm  sticky top-0 border-b-[0.5px] border-neutral-200 bg-white mx-6 pb-1 ${styles["group-label"]}`}
                style={{ zIndex: 9 }}
            >
                {group.label}
            </div>
                {group.items.map((item, idx) => (
                    <HistoryItem
                        key={item.id || idx}
                        item={item}
                        onItemClick={onItemClick}
                        onDelete={onDelete}
                        onSwipeProgress={onSwipeProgress}
                        onSwipeEnd={onSwipeEnd}
                    />
                ))}
        </div>
    );
};

export default HistoryGroup;