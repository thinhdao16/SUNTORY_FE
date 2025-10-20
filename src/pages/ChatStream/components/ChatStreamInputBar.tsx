import React, { useRef } from "react";
import CameraIcon from "@/icons/logo/chat/cam.svg?react";
import ImageIcon from "@/icons/logo/chat/image.svg?react";
// import FileIcon from "@/icons/logo/chat/file.svg?react";
import SendIcon from "@/icons/logo/chat/send.svg?react";
import CameraWeb from "@/pages/Camera/CameraWeb";

interface ChatStreamInputBarProps {
    messageValue: string;
    setMessageValue: (v: string) => void;
    isLoading: boolean;
    isLoadingHistory: boolean;
    messageRef: React.RefObject<HTMLTextAreaElement>;
    handleSendMessage: (e: any, force?: boolean) => void;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onTakePhoto: () => void;
    isSpending?: boolean;
    uploadImageMutation: any;
    addPendingImages: (images: string[]) => void;
    isNative?: boolean;
    isDesktop?: boolean;
    imageLoading?: boolean;
    imageLoadingMany?: boolean;
    anActivate: boolean;
    showToast: (message: string,duration?: number, type?: "success" | "error" | "info") => void;
}

const ChatStreamInputBar: React.FC<ChatStreamInputBarProps> = ({
    messageValue,
    setMessageValue,
    isLoading,
    isLoadingHistory,
    messageRef,
    handleSendMessage,
    handleImageChange,
    handleFileChange,
    onTakePhoto,
    isSpending,
    uploadImageMutation,
    addPendingImages,
    isNative,
    isDesktop,
    imageLoading,
    imageLoadingMany,
    anActivate,
    showToast,
}) => {
    const isLoadingBtn = useMemo(() => {
        return isSpending || isLoading || imageLoading || imageLoadingMany || isLoadingHistory;
    }, [isSpending, isLoading, imageLoading, imageLoadingMany, isLoadingHistory]);

    const composingRef = useRef(false);
    const normalizePastedText = (s: string) => {
        try { s = s.normalize('NFKC'); } catch {}
        s = s.replace(/\u00A0/g, ' ');
        s = s.replace(/[\u200B-\u200D\u2060\uFEFF\uFE0E\uFE0F]/g, '');
        s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
        return s;
    };

    return (
        <>
        {!anActivate &&(
                <div className="flex items-center px-6 pt-4 pb-6">
                <textarea
                    placeholder={t("Enter your message...")}
                    ref={messageRef}
                    value={messageValue}
                    onChange={(e) => setMessageValue(e.target.value)}
                    // disabled={isLoading || isSpending || imageLoading || imageLoadingMany}
                    className="flex-1 focus:outline-none resize-none max-h-[230px] overflow-y-auto"
                    rows={1}
                    onFocus={() => {
                        if (!isNative) {
                            setTimeout(() => {
                                window.dispatchEvent(new Event("resize"));
                            }, 100);
                        }
                    }}
                    onCompositionStart={() => { composingRef.current = true; }}
                    onCompositionEnd={() => { composingRef.current = false; }}
                    onKeyDown={(e) => {
                        // Block Enter during IME composition (Vietnamese, Chinese, Japanese...)
                        if (composingRef.current || (e.nativeEvent as any)?.isComposing) {
                            return;
                        }
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (!isLoadingBtn) {
                                handleSendMessage(e, true);
                            }
                        }
                    }}
                    onPaste={async (e) => {
                        const cd = e.clipboardData; const items = cd?.items;
                        const pastedText = cd?.getData('text/plain') || '';
                        if (pastedText) {
                            e.preventDefault();
                            const norm = normalizePastedText(pastedText);
                            const ta = messageRef.current;
                            const start = (ta?.selectionStart ?? messageValue.length);
                            const end = (ta?.selectionEnd ?? start);
                            const next = messageValue.slice(0, start) + norm + messageValue.slice(end);
                            setMessageValue(next);
                            setTimeout(() => { if (ta) { try { ta.setSelectionRange(start + norm.length, start + norm.length); } catch {} } }, 0);
                        }
                        if (items) {
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
                        }
                    }}
                />
            </div>
        )}
            <div className="flex justify-between items-center px-6">
                <div className="flex gap-6">
                    { isDesktop ? (
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
                        // disabled={isSpending}
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
                    {isLoadingBtn ? (
                        <div className="w-6 h-6 animate-spin border-2 border-t-transparent border-gray-500 rounded-full" />
                    ) : (
                        <button
                            type="button"
                            onClick={(e) => handleSendMessage(e, true)}
                            disabled={isSpending || isLoading || imageLoading || imageLoadingMany || isLoadingHistory}
                        >
                            <SendIcon aria-label={t("send")} />
                        </button>
                    )}
                </div>
            </div>
        </>
    )
};

export default ChatStreamInputBar;