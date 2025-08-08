import { ChatMessage } from "@/types/social-chat";
import React from "react";

export const MessageBubble: React.FC<{
    msg: ChatMessage;
    isUser: boolean;
    isError?: boolean;
    isSend?: boolean;
    isEdited: boolean;
    isRevoked: boolean;
    onEdit?: () => void;
    onRevoke?: () => void;
    onReply?: () => void;
    actionContainerRef?: React.RefObject<HTMLDivElement | null>;
    showActionsMobile?: boolean;
}> = ({
    msg, isUser, isError, isSend, isEdited, isRevoked,
    onEdit, onRevoke, onReply, actionContainerRef, showActionsMobile
}) => (
    <div
        className={` w-fit  
       
        ${isError && !isSend
                ? "bg-red-50 text-red-700 border border-red-400 rounded-[16px]"
                : isUser
                    ? "bg-main text-white rounded-br-md rounded-[16px_16px_4px_16px]"
                    : "bg-screen-page text-gray-900 rounded-[4px_16px_16px_16px]"
            }
        ${isRevoked && "border border-netural-100 text-netural-200 bg-white"}
    `}
        style={{
            maxWidth: "calc(100vw - 130px)",
            touchAction: 'pan-y', // ← Cho phép horizontal drag
            pointerEvents: 'auto' // ← Đảm bảo pointer events hoạt động
        }}
    >
        <div className="flex relative">
            <div className="w-full px-3 py-2 min-w-[60px] xl:max-w-[250px]">
                {/* ↑ BỎ overflow-x-auto */}
                <div className="prose prose-sm whitespace-break-spaces break-words text-[15px] text-left">
                    {!isRevoked
                        ? msg.messageText
                        : <span className="text-netural-200 italic">This message has been revoked</span>}
                </div>
                {!isRevoked && (
                    <div ref={actionContainerRef}
                        className={`absolute w-full top-1/2 -translate-y-1/2 ${isUser ? "-left-24" : "-right-24"} ${showActionsMobile ? "flex" : "hidden group-hover:flex"} gap-2 p-1`}
                        style={{ pointerEvents: 'auto' }} // ← Đảm bảo buttons clickable
                    >
                        {isUser && (<>
                            <button onClick={onEdit}>✏️</button>
                            <button onClick={onRevoke}>🗑️</button>
                        </>)}
                        <button onClick={onReply}>↩️</button>
                    </div>
                )}
            </div>
        </div>

        {isEdited && !isRevoked && (
            <div className={`absolute -top-5 ${isUser ? "right-2" : "left-2"} text-xs text-main font-semibold`}>
                Edited
            </div>
        )}
    </div>
);
