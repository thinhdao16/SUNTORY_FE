import { ChatMessage } from "@/types/social-chat";
import React, { useState } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { MdModeEditOutline, MdOutlineReply, MdTranslate } from "react-icons/md";
import { t } from "@/lib/globalT";
import { useBottomSheet } from "@/hooks/useBottomSheet";

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
    onTranslate?: () => void; 
    actionContainerRef?: React.RefObject<HTMLDivElement | null>;
    showActionsMobile?: boolean;
    hasReachedLimit?: boolean;
    isTranslating?: boolean; 
}> = ({
    msg, isUser, isError, isSend, isEdited, isRevoked,
    onEdit, onRevoke, onReply, onTranslate, actionContainerRef, 
    showActionsMobile, hasReachedLimit = false, isTranslating = false
}) => {
    const [translatedText, setTranslatedText] = useState<string | null>(null);

    const handleTranslate = () => {
        if (onTranslate) {
            onTranslate();
        }
    };

    React.useEffect(() => {
        if (msg.translatedText) {
            setTranslatedText(msg.translatedText);
        }
    }, [msg.translatedText]);

    return (
        <>
            <div
                className={`w-fit relative z-[1]
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
                <div className="flex">
                    <div className="w-full px-3 py-2 min-w-[40px] lg:max-w-[250px] xl:max-w-[250px] relative">
                        <div className="prose prose-sm whitespace-break-spaces break-words text-[15px] text-left">
                            {!isRevoked ? (
                                <>
                                    <div>{msg.messageText}</div>
                                    
                                    {translatedText && !isTranslating && (
                                        <>
                                            <hr className="my-2 border-t border-current opacity-30" />
                                            <div className="italic opacity-90">
                                                {translatedText}
                                            </div>
                                        </>
                                    )}
                                    
                                    {isTranslating && (
                                        <>
                                            <hr className="my-2 border-t border-current opacity-30" />
                                            <div className="italic opacity-70 flex items-center gap-1">
                                                <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full"></div>
                                                {t("Translating")}...
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <span className="text-netural-200 italic">
                                    {t("This message has been revoked")}
                                </span>
                            )}
                        </div>
                        
                        {!isRevoked && (
                            <div
                                ref={actionContainerRef}
                                className={`absolute top-1/2 -translate-y-1/2 gap-2 p-1 text-main z-[2]
                                    ${showActionsMobile ? "flex" : "hidden group-hover:flex"}
                                    ${isUser ? "right-full -mr-0" : "left-full -ml-0"}`}
                                style={{ pointerEvents: "auto" }}
                            >
                                {isUser && (
                                    <>
                                        <button onClick={onEdit} title={t("Edit")}>
                                            <MdModeEditOutline className="text-xl" />
                                        </button>
                                        <button onClick={onRevoke} title={t("Delete")}>
                                            <FaRegTrashAlt className="text-xl" />
                                        </button>
                                    </>
                                )}
                                
                                    <button 
                                        onClick={handleTranslate} 
                                        title={t("Translate")}
                                        disabled={isTranslating}
                                        className={isTranslating ? "opacity-50" : ""}
                                    >
                                        <MdTranslate className="text-xl" />
                                    </button>
                                
                                {!hasReachedLimit && (
                                    <button onClick={onReply} title={t("Reply")}>
                                        <MdOutlineReply className="text-xl" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
