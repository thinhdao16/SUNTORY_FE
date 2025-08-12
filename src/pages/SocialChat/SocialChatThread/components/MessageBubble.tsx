import { ChatMessage } from "@/types/social-chat";
import React from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { MdModeEditOutline, MdOutlineReply } from "react-icons/md";

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
        <>
            {isEdited && !isRevoked && (
                <div className={`${isUser ? "text-end pr-2" : "text-left pl-2"} text-xs text-main font-semibold pt-2 pb-1`}>
                    Edited
                </div>
            )}
            <div
                className={` w-fit  relative z-[1]
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
                    touchAction: 'pan-y',
                    pointerEvents: 'auto'
                }}
            >
                <div className="flex relative">
                    <div className="w-full px-3 py-2 min-w-[60px] lg:max-w-[250px] xl:max-w-[250px] ">
                        <div className="prose prose-sm whitespace-break-spaces break-words text-[15px] text-left">
                            {!isRevoked
                                ? msg.messageText
                                : <span className="text-netural-200 italic">This message has been revoked</span>}
                        </div>
                        {!isRevoked && (
                            <div ref={actionContainerRef}
                                className={`absolute text-main w-full top-1/2 -translate-y-1/2 ${isUser ? "-left-24" : "-right-24"} ${showActionsMobile ? "flex" : "hidden group-hover:flex"} gap-2 p-1`}
                                style={{ pointerEvents: 'auto' }}
                            >
                                {isUser && (<>
                                    <button onClick={onEdit}><MdModeEditOutline className="z-99 text-2xl" /></button>
                                    <button onClick={onRevoke}><FaRegTrashAlt className="z-99 text-2xl" /></button>
                                </>)}
                                <button onClick={onReply}><MdOutlineReply className="z-99 text-2xl" /></button>
                            </div>
                        )}
                    </div>
                </div>


            </div>
        </>
    );
