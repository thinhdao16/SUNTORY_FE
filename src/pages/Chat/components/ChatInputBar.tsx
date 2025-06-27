import React from "react";

interface ChatInputBarProps {
    messageValue: string;
    setMessageValue: (v: string) => void;
    isLoading: boolean;
    messageRef: React.RefObject<HTMLTextAreaElement>;
    handleSendMessage: (e: any, force?: boolean) => void;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onTakePhoto: () => void;
    isSpending?: boolean;
}

const ChatInputBar: React.FC<ChatInputBarProps> = ({
    messageValue,
    setMessageValue,
    isLoading,
    messageRef,
    handleSendMessage,
    handleImageChange,
    handleFileChange,
    onTakePhoto,
    isSpending
}) => (
    <>
        <div className="flex items-center px-6 pt-4 pb-6">
            <textarea
                placeholder={t("Enter your message...")}
                ref={messageRef}
                value={messageValue}
                onChange={(e) => setMessageValue(e.target.value)}
                disabled={isLoading || isSpending}
                className="flex-1 focus:outline-none resize-none max-h-[230px] overflow-y-auto"
                rows={1}
                onFocus={() => {
                    setTimeout(() => {
                        window.dispatchEvent(new Event("resize"));
                    }, 200);
                }}
            />
        </div>
        <div className="flex justify-between items-center px-6">
            <div className="flex gap-6">
                <button onClick={onTakePhoto} disabled={isSpending}>
                    <img src="logo/chat/cam.svg" alt={t("camera")} />
                </button>
                <label>
                    <img src="logo/chat/image.svg" alt={t("image")} />
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageChange}
                        disabled={isSpending}

                    />
                </label>
                <label>
                    <img src="logo/chat/file.svg" alt={t("file")} />
                    <input
                        type="file"
                        multiple
                        accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.txt,.zip,.rar,.csv"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isSpending}

                    />
                </label>
            </div>
            <div className="flex gap-6">
                {/* <button onClick={onTakePhoto}>
                    <img src="logo/chat/mic.svg" alt={t("microphone")} />
                </button> */}
                <button
                    type="button"
                    onClick={(e) => handleSendMessage(e, true)}
                    disabled={isSpending}
                >
                    <img src="logo/chat/send.svg" alt={t("send")} />
                </button>
            </div>
        </div>
    </>
);

export default ChatInputBar;