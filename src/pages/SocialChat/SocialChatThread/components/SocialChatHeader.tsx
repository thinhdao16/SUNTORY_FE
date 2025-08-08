import React from "react";
import { IoArrowBack } from "react-icons/io5";


interface SocialChatHeaderProps {
    onBackClick: () => void;
    roomChatInfo?: {
        avatarRoomChat?: string;
        title?: string;
    } | null;
}

const SocialChatHeader: React.FC<SocialChatHeaderProps> = ({
    onBackClick,
    roomChatInfo
}) => {
    return (
        <div className="relative flex items-center justify-between px-6 h-[50px]">
            <div className="flex items-center gap-4 z-10">
                <button onClick={onBackClick} aria-label="Back">
                    <IoArrowBack size={20} className="text-blue-600" />
                </button>
                <div className="flex items-center gap-2">
                    <img
                        src={roomChatInfo?.avatarRoomChat || '/favicon.png'}
                        alt={roomChatInfo?.title}
                        className="w-[34px] h-[34px] rounded-full object-cover"
                        onError={(e) => {
                            e.currentTarget.src = '/favicon.png';
                        }}
                    />
                    <span className="text-sm font-semibold text-gray-800">
                        {roomChatInfo?.title || "Chat Room"}
                    </span>
                </div>
            </div>
            
        </div>
    );
};

export default SocialChatHeader;