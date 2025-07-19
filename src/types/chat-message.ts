export enum MessageState {
    PENDING = 'PENDING_MESSAGE',
    FAILED = 'FAILED_MESSAGE',
}

export interface MessageStatus {
    status: MessageState;
}
export interface StreamMsg {
    messageCode: string;
    chatCode: string;
    chunks: any[];
    isStreaming: boolean;
    isComplete: boolean;
    hasError: boolean;
    completeText: string;
    startTime: string;
    code: string;
    id: number;
    userMessageId: number;
    endTime: string;
}