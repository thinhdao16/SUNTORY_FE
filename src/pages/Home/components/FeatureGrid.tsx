import React from 'react';
import { useHistory } from 'react-router-dom';

import LinkToIcon from "@/icons/logo/link_to.svg?react";

interface Feature {
    image: React.ReactElement;
    title: string;
    link: () => string;
}

interface FeatureGridProps {
    features: Feature[];
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({ features }) => {
    const history = useHistory();

    return (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 gap-4 relative z-9">
            {features.map((feature) => (
                <div
                    key={feature.title}
                    className="bg-white rounded-2xl p-4 flex flex-col items-start justify-start aspect-square w-full"
                    onClick={() => history.push(feature.link())}
                >
                    <div className="flex justify-between gap-0.5 items-center w-full mb-1">
                        <div className="font-semibold leading-none text-[14px] mb-1">{feature.title}</div>
                        <button
                            className="top-3 right-3 bg-main rounded-full aspect-square h-[30px] flex items-center justify-center shadow-md"
                            onClick={(e) => {
                                e.stopPropagation();
                                history.push(feature.link());
                            }}
                        >
                            <LinkToIcon />
                        </button>
                    </div>
                    {feature.image}
                </div>
            ))}
        </div>
    );
};
