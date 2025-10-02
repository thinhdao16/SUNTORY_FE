import { ChatMessage } from "@/types/social-chat";
import React from "react";
import { useTranslation } from "react-i18next";
import { IoAttach } from "react-icons/io5";
import { SystemMessageType, KEYCHATFORMATNOTI } from "@/constants/socialChat";

interface ReplyBubbleProps {
    msg: ChatMessage;
    isUser: boolean;
    isRevoked: boolean;
}

const ReplyBubble: React.FC<ReplyBubbleProps> = ({ msg, isUser, isRevoked }) => {
    const { t } = useTranslation();

    const rawText = (msg.messageText || "").trim();
    let isSharedSystem = false;
    try {
        const sys = JSON.parse(rawText);
        if (sys && sys.Event && sys.Key === KEYCHATFORMATNOTI) {
            const val = SystemMessageType[sys.Event as keyof typeof SystemMessageType];
            if (val === SystemMessageType.NOTIFY_GROUP_CHAT_SHARED) {
                isSharedSystem = true;
            }
        }
    } catch { /* not system json */ }

    const summarizeAttachments = () => {
        const atts = Array.isArray(msg.chatAttachments) ? msg.chatAttachments : [];
        const isImage = (a: any) => a?.fileType === 10 || /\.(jpg|jpeg|png|gif|webp|heic|bmp)$/i.test(a?.fileName || a?.fileUrl || "");
        const imgCount = atts.filter(isImage).length;
        const fileCount = atts.length - imgCount;
        if (atts.length <= 0) return t("Attachment");
        if (imgCount > 0 && fileCount === 0) return imgCount === 1 ? t("Photo") : t("{{count}} photos", { count: imgCount });
        if (fileCount > 0 && imgCount === 0) return fileCount === 1 ? t("File") : t("{{count}} files", { count: fileCount });
        return t("{{count}} attachments", { count: atts.length });
    };

    const summaryText = isSharedSystem ? summarizeAttachments() : "";

    return (
        <div className={`${isUser ? "ml-auto" : "mr-auto"} -mb-[19px]`}>

            {!isRevoked ? (
                <>
                    {isSharedSystem ? (
                        <div
                            className={` bg-[#f0f0f0] opacity-60 w-fit min-w-[40px] p-[8px_12px_16px_12px]  max-w-[250px] overflow-hidden 
            ${isUser
                                    ? " rounded-[16px_16px_4px_16px] ml-auto text-right"
                                    : "  rounded-[16px_16px_16px_4px] mr-auto text-left"
                                }`}
                        >
                            <div className="truncate text-[13px] text-netural-400 flex items-center gap-1">
                                <IoAttach className="w-4 h-4 text-netural-400" />
                                <span>{summaryText || t("Attachment")}</span>
                            </div>
                        </div>
                    ) : msg.messageText ? (
                        <div
                            className={` bg-[#f0f0f0] opacity-60 w-fit min-w-[40px] p-[8px_12px_16px_12px]  max-w-[250px] overflow-hidden 
            ${isUser
                                    ? " rounded-[16px_16px_4px_16px] ml-auto text-right"
                                    : "  rounded-[16px_16px_16px_4px] mr-auto text-left"}`}
                        >
                            <div className="truncate text-[13px] text-netural-400">
                                {msg.messageText || "(No content)"}
                            </div>
                        </div>
                    ) : (
                        <div className="">
                            <div className={`relative flex ${isUser ? "justify-end" : "justify-start"}  w-full max-w-[250px] h-[100px]`}>
                                <img
                                    src={msg?.chatAttachments?.[0]?.fileUrl || './favicon.png'}
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
