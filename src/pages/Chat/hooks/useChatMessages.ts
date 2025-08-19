import { RefObject, useEffect, useState, useRef } from "react";
import { useQuery } from "react-query";
import { useChatStore } from "@/store/zustand/chat-store";
import { getChatMessages } from "@/services/chat/chat-service";

export interface ChatMessage {
    id: number;
    text: string;
    isRight: boolean;
    createdAt: number;
    [x: string]: any;
}

export function useChatMessages(
    messageRef: RefObject<any>,
    messagesEndRef: RefObject<HTMLDivElement | null>,
    messagesContainerRef: RefObject<HTMLDivElement | null>,
    sessionId?: string,
    hasFirstSignalRMessage?: boolean,
    isOnline: boolean = true
) {
    const { messages, setMessages, addMessage, clearMessages } = useChatStore();
    const [messageValue, setMessageValue] = useState("");

    const { isLoading, refetch, isFetching } = useQuery(
        ["chatMessages", sessionId],
        () => (sessionId ? getChatMessages(sessionId, 0, 50) : Promise.resolve({ items: [], hasMore: false })),
        {
            enabled: !!sessionId &&
                !hasFirstSignalRMessage &&
                isOnline,
            onSuccess: (data) => setMessages(data.items),
            onError: () => setMessages([]),
        }
    );
    const prevOnline = useRef(isOnline);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const sendMessage = (e: any, force = false) => {
        if ((e.key === "Enter" && !e.shiftKey) || force) {
            e.preventDefault?.();
            if (messageValue.trim()) {
                addMessage({
                    id: Date.now(),
                    text: messageValue,
                    isRight: true,
                    createdAt: Date.now(),
                });
                setMessageValue("");
                setTimeout(scrollToBottom, 100);
            }
        }
    };

    useEffect(() => {
        if (isOnline && !prevOnline.current) {
            console.log("have connect")
            refetch();
        }
        prevOnline.current = isOnline;
    }, [isOnline, refetch, sessionId, hasFirstSignalRMessage]);

    useEffect(() => {
        if (!sessionId) {
            clearMessages();
        }
    }, [sessionId, clearMessages]);

    return {
        messages,
        isLoading: isLoading || isFetching,
        sendMessage,
        scrollToBottom,
        messageValue,
        setMessageValue,
    };
}