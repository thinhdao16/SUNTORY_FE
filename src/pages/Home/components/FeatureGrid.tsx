// FeatureGrid.tsx
import React from 'react';
import { useHistory } from 'react-router-dom';
import { TopicType } from '@/constants/topicType';
import LinkToIcon from "@/icons/logo/vector_right_white.svg?react";
import style from '../Home.module.css';
interface Feature {
    image: React.ReactElement;
    title: string;
    desc: string;              
    topic: TopicType;
}

interface FeatureGridProps {
    features: Feature[];
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({ features }) => {
    const history = useHistory();
    const handleFeatureClick = (topic: TopicType) => {
        if (topic === TopicType.MenuTranslation) {
            history.push(`/menu-translation`, { actionFrom: '/home' });
        } else {
            history.push(`/chat/${topic}`, { actionFrom: '/home' });
        }
    };

    return (
        <div className="grid grid-cols-1 gap-4 relative z-9">
            {features.map((feature) => (
                <div
                    key={feature.title}
                    className={`bg-white rounded-3xl p-3 flex items-center gap-4 w-full cursor-pointer transition-shadow ${style.customShadow}`}
                    onClick={() => handleFeatureClick(feature.topic)}
                    
                >
                    {feature.image}

                    <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold text-gray-900 truncate">
                            {feature.title}
                        </div>
                        <div className="text-[12px] text-gray-500 mt-1 line-clamp-2">
                            {feature.desc}
                        </div>
                    </div>
                    <button
                        className="shrink-0 bg-main rounded-full h-8 w-8 grid place-items-center shadow-md hover:bg-main/90 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleFeatureClick(feature.topic);
                        }}
                        aria-label="Open"
                    >
                        <LinkToIcon />
                    </button>
                </div>
            ))}
        </div>
    );
};
