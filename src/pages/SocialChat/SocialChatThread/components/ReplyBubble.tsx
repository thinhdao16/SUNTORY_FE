import { ChatMessage } from "@/types/social-chat";
import React from "react";

interface ReplyBubbleProps {
    msg: ChatMessage;
    isUser: boolean;
}

const ReplyBubble: React.FC<ReplyBubbleProps> = ({ msg, isUser }) => {
    return (
        <div className={`${isUser ? "ml-auto" : "mr-auto"} `}>
            <div className="text-[12px] font-medium mb-1 text-gray-500">
                {isUser ? "You are replying to user" : "User is replying to you"}
            </div>
            {msg.messageText ? (
                <div
                    className={` bg-[#C8D6FB] w-fit min-w-[60px] p-[8px_12px_24px_12px]  max-w-[250px] overflow-hidden -mb-[19px]
            ${isUser
                            ? " rounded-[16px_16px_4px_16px] ml-auto text-right"
                            : "  rounded-[16px_16px_16px_4px] mr-auto text-left"
                        }`}
                >

                    <div className="truncate text-[13px] text-gray-800">
                        {msg.messageText || "(No content)"}
                    </div>
                </div>
            ) : (
                <div className="-mb-[19px]">
                    <div className={`relative flex ${isUser ? "justify-end" : "justify-start"}  w-full max-w-[250px] h-[100px]`}>
                        <img
                            src={msg.chatAttachments?.[0]?.fileUrl || './favicon.png'}
                            alt="reply-img"
                            className=" h-full max-h-[100px] object-cover opacity-75 rounded-3xl "
                            onError={e => { e.currentTarget.src = './favicon.png'; }}
                            style={{ filter: "brightness(0.7)" }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
};

export default ReplyBubble;
