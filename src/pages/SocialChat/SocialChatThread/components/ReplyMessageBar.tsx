import React from "react";
import { ChatMessage } from "@/types/social-chat";
import { IoClose } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import { SystemMessageType, KEYCHATFORMATNOTI } from "@/constants/socialChat";

interface ReplyMessageBarProps {
    replyingToMessage: ChatMessage;
    onCancelReply: () => void;
}

const ReplyMessageBar: React.FC<ReplyMessageBarProps> = ({
    replyingToMessage,
    onCancelReply
}) => {
    const { t } = useTranslation();
    const userName = replyingToMessage.userName || "Unknown";

    const rawText = (replyingToMessage.messageText || "").trim();

    const summarizeAttachments = () => {
        const atts = Array.isArray(replyingToMessage.chatAttachments) ? replyingToMessage.chatAttachments : [];
        const isImage = (a: any) => a?.fileType === 10 || /\.(jpg|jpeg|png|gif|webp|heic|bmp)$/i.test(a?.fileName || a?.fileUrl || "");
        const imgCount = atts.filter(isImage).length;
        const fileCount = atts.length - imgCount;
        if (atts.length <= 0) return t("Attachment");
        if (imgCount > 0 && fileCount === 0) return imgCount === 1 ? t("Photo") : t("{{count}} photos", { count: imgCount });
        if (fileCount > 0 && imgCount === 0) return fileCount === 1 ? t("File") : t("{{count}} files", { count: fileCount });
        return t("{{count}} attachments", { count: atts.length });
    };

    let displayText = "";
    try {
        const sys = JSON.parse(rawText);
        if (sys && sys.Event && sys.Key === KEYCHATFORMATNOTI) {
            const eventValue = SystemMessageType[sys.Event as keyof typeof SystemMessageType];
            if (eventValue === SystemMessageType.NOTIFY_GROUP_CHAT_SHARED) {
                displayText = summarizeAttachments();
            } else {
                displayText = t("System notification");
            }
        }
    } catch {}

    if (!displayText) {
        if (!rawText && (replyingToMessage.chatAttachments?.length || 0) > 0) {
            displayText = summarizeAttachments();
        } else {
            displayText = rawText || t("Photo");
        }
    }

    return (
        <div className="bg-netural-50  px-6 py-2  ">
            <div className="flex items-center justify-between">
                <div className="flex">
                    <span className="font-semibold inline-flex">
                        <span className="inline-block max-w-[130px] truncate align-middle">
                            {t("Reply")} {userName}
                        </span>
                        :
                    </span>
                    {" "}
                    <span className="inline-block truncate max-w-[230px] text-netural-300 align-middle">
                        {displayText.length > 50
                            ? `${displayText.substring(0, 50)}...`
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