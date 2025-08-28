/* eslint-disable @typescript-eslint/no-explicit-any */
import { RefObject, useEffect, useState, useRef, useCallback } from "react";
import { useInfiniteQuery } from "react-query";
import { useChatStore } from "@/store/zustand/chat-store";
import { getChatMessages } from "@/services/chat/chat-service";

const PAGE_SIZE = 30;

export function useChatStreamMessages(
    messageRef: RefObject<any>,
    messagesEndRef: RefObject<HTMLDivElement | null>,
    messagesContainerRef: RefObject<HTMLDivElement | null>,
    sessionId?: string,
    hasFirstSignalRMessage?: boolean,
    isOnline: boolean = true,
    recall: any = null
) {
    const { messages, setMessages, addMessage, clearMessages } = useChatStore();
    const [messageValue, setMessageValue] = useState("");

    const {
        data,
        isLoading,
        isFetching,
        fetchNextPage,           
        hasNextPage,
        refetch,
        isFetchingNextPage,
    } = useInfiniteQuery(
        ["chatMessages", sessionId],
        async ({ pageParam = 0 }) => {
            if (!sessionId) return { items: [], hasMore: false };
            return getChatMessages(sessionId, pageParam, PAGE_SIZE);
        },
        {
            enabled: !!sessionId && !hasFirstSignalRMessage && isOnline,
            getNextPageParam: (lastPage, allPages) =>
                lastPage.hasMore ? allPages.length + 1 : undefined,
            onSuccess: (res) => {
                const flat = (res.pages ?? []).flatMap((p: any) => p.items ?? []);
                setMessages(flat);
            },
            refetchOnWindowFocus: false,
        }
    );

    const lastPage = data?.pages?.[data.pages.length - 1] ?? null;

    const prevOnline = useRef(isOnline);
    useEffect(() => {
        if (isOnline && !prevOnline.current) {
            refetch();
        }
        prevOnline.current = isOnline;
    }, [isOnline, refetch]);

    useEffect(() => {
        if (!sessionId) {
            clearMessages();
        }
    }, [sessionId, clearMessages]);

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

    const handleScrollLoadMore = useCallback(async () => {
        const el = messagesContainerRef.current;
        recall()
        if (!el || isFetchingNextPage || !hasNextPage) return;

        if (el.scrollTop <= 150) {
            const prevScrollHeight = el.scrollHeight;
            const prevScrollTop = el.scrollTop;

            await fetchNextPage();

            requestAnimationFrame(() => {
                const newScrollHeight = el.scrollHeight;
                el.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
            });
        }
    }, [messagesContainerRef, fetchNextPage, isFetchingNextPage, hasNextPage]);

    return {
        messages,
        lastPage,
        isLoading: isLoading || isFetching,
        isFetchingNextPage,
        hasNextPage,
        handleScrollLoadMore,
        sendMessage,
        scrollToBottom,
        messageValue,
        setMessageValue,
    };
}
