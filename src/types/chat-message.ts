export enum MessageState {
    PENDING = 'PENDING_MESSAGE',
    FAILED = 'FAILED_MESSAGE',
}

export interface MessageStatus {
    status: MessageState;
}