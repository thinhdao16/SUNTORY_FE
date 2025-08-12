// src/pages/SocialChat/SocialChatThread/components/TimeGroupHeader.tsx
import React from "react";

interface TimeGroupHeaderProps {
    displayTime: string;
}

export const TimeGroupHeader: React.FC<TimeGroupHeaderProps> = ({ displayTime }) => {
    return (
        <div className="flex justify-center my-4">
            <div className="bg-gray-100 px-3 py-1 rounded-full">
                <span className="text-xs text-gray-600 font-medium">
                    {displayTime}
                </span>
            </div>
        </div>
    );
};