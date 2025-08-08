// src/pages/SocialChat/SocialChatThread/components/ReplyMessageBar.tsx
import React from "react";
import { ChatMessage } from "@/types/social-chat";
import { IoClose } from "react-icons/io5";

interface ReplyMessageBarProps {
    replyingToMessage: ChatMessage;
    onCancelReply: () => void;
}

const ReplyMessageBar: React.FC<ReplyMessageBarProps> = ({
    replyingToMessage,
    onCancelReply
}) => {
    const displayText = replyingToMessage.messageText || "Hình ảnh";
    const userName = replyingToMessage.userName || "Unknown";

    return (
        <div className="bg-netural-50  px-6 py-2  ">
            <div className="flex items-center justify-between">
                <div className="flex">
                    <span className="font-semibold inline-flex">
                        <span className="inline-block max-w-[130px] truncate align-middle">
                            {t("Reply ")}{" "}{userName}
                        </span>
                        :
                    </span>
                    {" "}
                    <span className="inline-block truncate text-netural-300 align-middle">
                        {displayText.length > 25
                            ? `${displayText.substring(0, 25    )}...`
                            : displayText}
                    </span>
                </div>
                <button
                    onClick={onCancelReply}
                    className="ml-2  hover:bg-gray-200 rounded-full transition-colors"
                >
                    <IoClose size={16} className="" />
                </button>
            </div>
        </div>
    );
};

export default ReplyMessageBar;