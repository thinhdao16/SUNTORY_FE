export interface ChatHistoryItem {
    id: string;
    title: string;
    timeLabel: string;
}

export interface ChatSidebarProps {
    history: ChatHistoryItem[];
    onSearch?: (value: string) => void;
    onNewChat?: () => void;
    onSelectChat?: (item: { type: string, code: string, topic: string }) => void;
    userName?: string;
    isOpen?: boolean;
    onClose?: () => void;
    sessionId?: string;
    userAvatar?: string;
}