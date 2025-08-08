import { ChatMessage } from "@/types/social-chat";
import React from "react";

interface ReplyBubbleProps {
    msg: ChatMessage;
    isUser: boolean;
}

const ReplyBubble: React.FC<ReplyBubbleProps> = ({ msg, isUser }) => (
    <div className={`${isUser ? "ml-auto" : "mr-auto"} `}>
        <div className="text-[12px] font-medium mb-1 text-gray-500">
            {isUser ? "You are replying to user" : "User is replying to you"}
        </div>
        <div
            className={` bg-[#C8D6FB] w-fit min-w-[60px] p-[8px_12px_24px_12px]  max-w-[250px] overflow-hidden -mb-[19px]
            ${isUser
                    ? " rounded-[16px_16px_4px_16px] ml-auto text-right"
                    : "  rounded-[4px_16px_16px_16px] mr-auto text-left"
                }`}
        >

            <div className="truncate text-[13px] text-gray-800">
                {msg.messageText || "(No content)"}
            </div>
        </div>
    </div>
);

export default ReplyBubble;
