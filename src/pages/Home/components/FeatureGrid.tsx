import React from 'react';
import { useHistory } from 'react-router-dom';
import { TopicType } from '@/constants/topicType';

import LinkToIcon from "@/icons/logo/link_to.svg?react";

interface Feature {
    image: React.ReactElement;
    title: string;
    topic: TopicType;
}

interface FeatureGridProps {
    features: Feature[];
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({ features }) => {
    const history = useHistory();

    const handleFeatureClick = (topic: TopicType) => {
        history.push(`/chat/${topic}`, {
            actionFrom: '/home',
        });
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 gap-4 relative z-9">
            {features.map((feature) => (
                <div
                    key={feature.title}
                    className="bg-white rounded-2xl p-5 flex flex-col items-start justify-start w-full cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleFeatureClick(feature.topic)}
                >
                    <div className="flex justify-between gap-1 items-center w-full mb-3">
                        <div className="font-semibold leading-none text-[14px] mb-1">{feature.title}</div>
                        <button
                            className="top-3 right-3 bg-main rounded-full aspect-square h-[30px] flex items-center justify-center shadow-md hover:bg-main/90 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleFeatureClick(feature.topic);
                            }}
                        >
                            <LinkToIcon />
                        </button>
                    </div>
                   <div className='w-full'>
                        {feature.image}
                    </div>
                </div>
            ))}
        </div>
    );
};
