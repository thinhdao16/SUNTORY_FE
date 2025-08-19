import { ChatMessage } from "@/types/social-chat";
import React from "react";

interface ReplyBubbleProps {
    msg: ChatMessage;
    isUser: boolean;
    isRevoked: boolean
}

const ReplyBubble: React.FC<ReplyBubbleProps> = ({ msg, isUser, isRevoked }) => {
    return (
        <div className={`${isUser ? "ml-auto" : "mr-auto"} -mb-[19px]`}>

            {!isRevoked ? (
                <>
                    {msg.messageText ? (
                        <div
                            className={` bg-[#C8D6FB] w-fit min-w-[40px] p-[8px_12px_24px_12px]  max-w-[250px] overflow-hidden 
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
                        <div className="">
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
                </>
            ) : (
                <div className={` w-full px-3 pt-2 pb-6 min-w-[60px] lg:max-w-[250px] xl:max-w-[250px]  relative z-[1]   border border-netural-100 text-netural-200 bg-white  ${isUser ? "rounded-br-md rounded-[16px_16px_4px_16px]" : "rounded-[4px_16px_16px_16px]"} `}
                    style={{
                        maxWidth: "calc(100vw - 130px)",
                        touchAction: 'pan-y',
                        pointerEvents: 'auto'
                    }}
                >
                    <span className="text-netural-200 italic">{t("This message has been revoked")}</span>

                </div>
            )}
        </div>
    )
};

export default ReplyBubble;
