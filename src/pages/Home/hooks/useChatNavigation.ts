export const useChatNavigation = (chatHistory: any[]) => {
    const getCodeByTopic = (topicId: number): string | undefined => {
        const chatItem = chatHistory.find(item => item.topic === topicId);
        return chatItem?.code;
    };

    const getChatLink = (topicId: number): string => {
        const code = getCodeByTopic(topicId);
        return code ? `/chat/${topicId}/${code}` : `/chat/${topicId}`;
    };

    return { getCodeByTopic, getChatLink };
};
