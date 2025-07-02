import React from "react";
import CameraIcon from "@/icons/logo/chat/cam.svg?react";
import ImageIcon from "@/icons/logo/chat/image.svg?react";
// import FileIcon from "@/icons/logo/chat/file.svg?react";
import SendIcon from "@/icons/logo/chat/send.svg?react";
import CameraWeb from "@/pages/Camera/CameraWeb";
// import MicIcon from "@/icons/logo/chat/mic.svg?react"; // Nếu cần dùng mic

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
    uploadImageMutation: any;
    addPendingImages: (images: string[]) => void;
    isNative?: boolean; // Thêm prop này nếu cần phân biệt native
    isDesktop?: boolean; // Thêm prop này nếu cần phân biệt desktop
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
    isSpending,
    uploadImageMutation,
    addPendingImages,
    isNative,
    isDesktop
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
                    }, 100);
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e, true);
                    }
                }}
                onPaste={async (e) => {
                    const items = e.clipboardData?.items;
                    if (!items) return;
                    for (const item of items) {
                        if (item.type.startsWith("image/")) {
                            const file = item.getAsFile();
                            if (file) {
                                await uploadImageMutation.mutateAsync(file, {
                                    onSuccess: (uploaded: any) => {
                                        if (uploaded && uploaded.length > 0) {
                                            addPendingImages([uploaded[0].linkImage]);
                                        }
                                    },
                                });
                            }
                        }
                    }
                }}
            />
        </div>
        <div className="flex justify-between items-center px-6">
            <div className="flex gap-6">
                {isNative || isDesktop ? (
                    <button onClick={onTakePhoto} disabled={isSpending}>
                        <CameraIcon aria-label={t("camera")} />
                    </button>
                ) : (
                    <CameraWeb />
                )}
                <label>
                    <ImageIcon aria-label={t("image")} />
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageChange}
                        disabled={isSpending}
                    />
                </label>
                {/* <label>
                    <FileIcon aria-label={t("file")} />
                    <input
                        type="file"
                        multiple
                        accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.txt,.zip,.rar,.csv"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isSpending}
                    />
                </label> */}
            </div>
            <div className="flex gap-6">
                {/* <button onClick={onTakePhoto}>
                    <MicIcon aria-label={t("microphone")} />
                </button> */}
                <button
                    type="button"
                    onClick={(e) => handleSendMessage(e, true)}
                    disabled={isSpending}
                >
                    <SendIcon aria-label={t("send")} />
                </button>
            </div>
        </div>
    </>
);

export default ChatInputBar;