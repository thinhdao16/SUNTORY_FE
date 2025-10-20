// components/ChatMessageActions.tsx
import React from "react";

const reactions = ["❤️", "😂", "😮", "😢", "😡", "👍", "👎"];

interface ChatMessageActionsProps {
    onEdit?: () => void;
    onRevoke?: () => void;
    onDelete?: () => void;
    onReply?: () => void;
    onCopy?: () => void;
}

const ChatMessageActions: React.FC<ChatMessageActionsProps> = ({
    onEdit,
    onRevoke,
    onDelete,
    onReply,
    onCopy
}) => {
    return (
        <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-lg border">
            {reactions.map((emoji) => (
                <button
                    key={emoji}
                    className="text-xl hover:scale-125 transition-transform"
                // onClick={() => onReact(emoji)}
                >
                    {emoji}
                </button>
            ))}
            <div className="w-px h-5 bg-gray-200 mx-1" />
            {onEdit && (
                <button
                    className="text-sm text-blue-500 hover:underline"
                    onClick={onEdit}
                >
                    {t("Edit")}
                </button>
            )}
            {onRevoke && (
                <button
                    className="text-sm text-orange-500 hover:underline"
                    onClick={onRevoke}
                >
                    {t("Revoke")}
                </button>
            )}
            {onDelete && (
                <button
                    className="text-sm text-red-500 hover:underline"
                    onClick={onDelete}
                >
                    {t("Delete")}
                </button>
            )}
            {onReply && (
                <button
                    className="text-sm text-gray-500 hover:underline"
                    onClick={onReply}
                >
                    {t("Reply")}
                </button>
            )}
        </div>
    );
};

export default ChatMessageActions;
