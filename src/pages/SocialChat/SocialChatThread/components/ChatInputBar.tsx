import React, { useState, useEffect } from "react";
import CameraIcon from "@/icons/logo/chat/cam.svg?react";
import ImageIcon from "@/icons/logo/chat/image.svg?react";
import SendIcon from "@/icons/logo/social-chat/send.svg?react";
import SendTranslateIcon from "@/icons/logo/social-chat/send-translate.svg?react";
import ExpandTranslateIcon from "@/icons/logo/social-chat/expland-translate.svg?react";
import ExpandInputIcon from "@/icons/logo/social-chat/expland-input.svg?react"
import TranslateIcon from "@/icons/logo/social-chat/translate.svg?react";
import TranslateFocusIcon from "@/icons/logo/social-chat/translate-focus.svg?react";
import LanguageDropdown from "./LanguageDropdown";
import { Language } from "@/store/zustand/language-store";
import { ChatMessage } from "@/types/social-chat";
import ReplyMessageBar from "./ReplyMessageBar";
import SocialChatCameraWeb from "../../SocialChatCamera/SocialChatCameraWeb";
import { useDebounce } from "@/hooks/useDebounce";

type TypingAPI = {
    touch: () => void;
    off: () => void;
    setStatus?: (s: "on" | "off") => void;
};
interface ChatInputBarProps {
    messageValue: string;
    setMessageValue: (v: string) => void;
    messageRef: React.RefObject<HTMLTextAreaElement>;
    handleSendMessage: (e: any, field: string, force?: boolean) => void;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onTakePhoto: () => void;
    uploadImageMutation: any;
    addPendingImages: (images: string[]) => void;
    isNative?: boolean;
    isDesktop?: boolean;
    messageTranslateRef: React.RefObject<HTMLTextAreaElement>;
    messageTranslate: string;
    setMessageTranslate: (v: string) => void;
    openModalTranslate: () => void;
    selectedLanguageSocialChat: Language;
    languagesSocialChat: Language[];
    setSelectedLanguageSocialChat: (v: Language) => void;
    replyingToMessage?: ChatMessage | null;
    setReplyingToMessage?: (v: ChatMessage | null) => void;
    onCancelReply?: () => void;
    hasReachedLimit?: boolean;
    openInputExpandSheet: () => void;
    openTranslateExpandSheet: () => void;
    onTranslate: (text: string) => Promise<void>
    setInputBarHeight: (h: number) => void;
    createTranslationMutation: any;
    actionFieldSend: string;
    isTranslating: boolean;
    translateActionStatus: boolean;
    setTranslateActionStatus: (value: boolean) => void
    typing: TypingAPI;
}

const ChatInputBar: React.FC<ChatInputBarProps> = ({
    messageValue,
    setMessageValue,
    messageRef,
    handleSendMessage,
    handleImageChange,
    onTakePhoto,
    uploadImageMutation,
    addPendingImages,
    isNative,
    isDesktop,
    messageTranslate,
    setMessageTranslate,
    openModalTranslate,
    selectedLanguageSocialChat,
    languagesSocialChat,
    setSelectedLanguageSocialChat,
    replyingToMessage,
    setReplyingToMessage,
    onCancelReply,
    messageTranslateRef,
    hasReachedLimit,
    openInputExpandSheet,
    openTranslateExpandSheet,
    onTranslate,
    setInputBarHeight,
    createTranslationMutation,
    actionFieldSend,
    isTranslating,
    translateActionStatus,
    setTranslateActionStatus,
    typing
}) => {
    const [focused, setFocused] = useState({ input: false, translate: false });
    const [open, setOpen] = useState(false);
    const [dots, setDots] = React.useState(".");


    const containerRef = useRef<HTMLDivElement>(null);
    const sendBtnRef = useRef<HTMLButtonElement>(null);

    const tAPI: TypingAPI = typing ?? { touch: () => { }, off: () => { } };

    const preventBlur = (e: React.SyntheticEvent) => e.preventDefault();
    const keepFocus = () => messageRef.current?.focus({ preventScroll: true });

    const onFocus = (field: string) => {
        if (field === "input") {
            setFocused({ ...focused, [field]: true, translate: false });
            tAPI.touch();
            const textarea = messageRef.current;
            if (textarea) {
                textarea.focus();
                const len = textarea.value.length;
                textarea.setSelectionRange(len, len);
            }
        }
        if (field === "translate") {
            setFocused({ ...focused, [field]: true, input: false });
            tAPI.touch();
            const textareaTranslate = messageTranslateRef.current;
            if (textareaTranslate) {
                textareaTranslate.focus();
                const len = textareaTranslate.value.length;
                textareaTranslate.setSelectionRange(len, len);
            }
        }
        setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    };

    const onBlur = (field: string) => {
        setFocused((prev) => ({ ...prev, [field]: false }));
        tAPI.off();
    };

    const handleChangeInput = (value: string) => {
        setMessageValue(value);
        tAPI.touch();
        if (value.trim() === "") setMessageTranslate("");
    };

    const handleChangeTranslate = (v: string) => {
        setMessageTranslate(v);
        tAPI.touch();
    };
    const handleTranslate = () => {
        setTranslateActionStatus(!translateActionStatus);
    };

    useEffect(() => {
        if (messageRef.current) {
            messageRef.current.style.height = 'auto';
            messageRef.current.style.height = `${messageRef.current.scrollHeight}px`;
        }
        if (messageTranslateRef.current) {
            messageTranslateRef.current.style.height = 'auto';
            messageTranslateRef.current.style.height = `${messageTranslateRef.current.scrollHeight}px`;
        }
    }, [messageValue, messageTranslate, focused]);


    const debouncedSource = useDebounce(messageValue, 500);

    useEffect(() => {
        if (translateActionStatus && debouncedSource.trim()) {
            onTranslate(debouncedSource);
        }
    }, [translateActionStatus, debouncedSource]);
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const report = () => {
            let h = el.offsetHeight;
            const cs = getComputedStyle(el);
            h += parseFloat(cs.marginTop) + parseFloat(cs.marginBottom) + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + 50;
            setInputBarHeight(h);
        };

        const ro = new ResizeObserver(report);
        ro.observe(el);
        report();
        return () => ro.disconnect();
    }, [setInputBarHeight]);
    useEffect(() => {
        if (!isTranslating) return;
        let count = 1;
        const interval = setInterval(() => {
            count = count % 3 + 1;
            setDots(".".repeat(count));
        }, 300);
        return () => clearInterval(interval);
    }, [isTranslating]);
    useEffect(() => () => tAPI.off(), []);
    return (
        <div
            ref={containerRef}
            className={`pb-1 bg-white relative ${hasReachedLimit ? "pointer-events-none opacity-50" : ""
                }`}
        >
            {replyingToMessage && (
                <ReplyMessageBar
                    replyingToMessage={replyingToMessage}
                    onCancelReply={onCancelReply ?? (() => { })}
                />
            )}
            {translateActionStatus && (
                <div className="flex items-end gap-4 px-6 py-2 border-t-1 border-netural-50">
                    <div className="relative flex-1">
                        {isTranslating && !messageTranslate && (
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-netural-200 pointer-events-none flex">
                                Translating
                                <span className="flex">
                                    {dots.split("").map((dot, i) => (
                                        <span
                                            key={i}
                                            className="animate-bounce"
                                            style={{ animationDelay: `${i * 0.15}s` }}
                                        >
                                            {dot}
                                        </span>
                                    ))}
                                </span>
                            </div>
                        )}
                        <textarea
                            placeholder={
                                isTranslating
                                    ? ""
                                    : t("Translate to...")
                            }
                            ref={messageTranslateRef}
                            value={messageTranslate}
                            onChange={(e) => handleChangeTranslate(e.target.value)}
                            rows={1}
                            disabled={hasReachedLimit || isTranslating}
                            className={`flex-1 w-full min-h-[35px] ${focused.translate
                                ? "max-h-20 overflow-y-auto whitespace-normal"
                                : "!max-h-[35px] !truncate whitespace-nowrap overflow-hidden"
                                } min-w-0 max-w-full resize-none overflow-y-auto px-4 py-2 rounded-3xl focus:outline-none placeholder:text-netural-200`}
                            onFocus={() => onFocus("translate")}
                            onClick={() => onFocus("translate")}
                            onBlur={() => onBlur("translate")}
                            onKeyDown={(e) => {
                                const event = e as unknown as { isComposing?: boolean; key: string; shiftKey: boolean; preventDefault: () => void };
                                tAPI.touch();
                                if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
                                    e.preventDefault();
                                    sendBtnRef.current?.click();
                                    tAPI.off();
                                }
                            }}
                        />
                    </div>
                    <div className="pb-1 gap-4 flex items-center h-fit">
                        <button onClick={openTranslateExpandSheet}
                        >
                            <ExpandTranslateIcon />
                        </button>

                        {/* {messageTranslate.trim() && (
                            <button
                                ref={sendTranslateBtnRef}
                                disabled={hasReachedLimit}
                                className="rounded-full p-2 flex items-center justify-center bg-chat-to"
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => handleSendMessage(e, "inputTranslate", true)}
                            >
                                <SendTranslateIcon />
                            </button>
                        )} */}
                    </div>
                    {/* <button className="bg-chat-to rounded-full p-2 flex items-center justify-center">
                        <SendTranslateIcon />
                    </button> */}
                </div>
            )}
            <div className="flex items-end gap-4 transition-all py-2 px-6" onMouseDown={preventBlur}>
                <textarea
                    placeholder={t("Type a message...")}
                    ref={messageRef}
                    value={messageValue}
                    onChange={(e) => handleChangeInput(e.target.value)}
                    rows={1}
                    disabled={hasReachedLimit}

                    className={`flex-1 min-h-[35px] ${focused.input
                        //    &&  actionStatus
                        ? 'max-h-30 overflow-y-auto whitespace-normal'
                        : '!max-h-[35px]  !truncate whitespace-nowrap overflow-hidden'
                        } min-w-0 max-w-full resize-none overflow-y-auto px-4 py-2 rounded-3xl bg-chat-to focus:outline-none placeholder:text-netural-100-100`}
                    onFocus={() => onFocus('input')}
                    onClick={() => onFocus('input')}
                    onBlur={() => onBlur('input')}
                    onKeyDown={(e) => {
                        const event = e as unknown as { isComposing?: boolean; key: string; shiftKey: boolean; preventDefault: () => void };
                        tAPI.touch();
                        if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
                            e.preventDefault();
                            sendBtnRef.current?.click();
                            tAPI.off();
                        }
                    }}
                    onPaste={async (e) => {
                        tAPI.touch();
                        const items = e.clipboardData?.items;
                        if (!items) return;
                        for (const item of items) {
                            if (item.type.startsWith('image/')) {
                                const file = item.getAsFile();
                                if (file) {
                                    const uploaded = await uploadImageMutation.mutateAsync(file);
                                    if (uploaded && uploaded.length) addPendingImages([uploaded[0].linkImage]);
                                }
                            }
                        }
                    }}
                />
                <div className="pb-2 gap-4 flex items-end h-fit">
                    <button onClick={openInputExpandSheet}>
                        <ExpandInputIcon />
                    </button>
                    {messageValue.trim() && (
                        <button
                            ref={sendBtnRef}
                            type="button"
                            disabled={hasReachedLimit}
                            onMouseDown={preventBlur}
                            onTouchStart={preventBlur}
                            onClick={(e) => {
                                keepFocus();
                                tAPI.off();
                                requestAnimationFrame(() => {
                                    handleSendMessage(e, actionFieldSend, true);
                                    requestAnimationFrame(() => keepFocus());
                                });
                            }}
                        >
                            <SendIcon />
                        </button>
                    )}
                </div>
            </div>
            <div className="flex items-center justify-between px-6 pt-2"    >
                <div className="flex  ">
                    <button className="flex space-x-4" disabled={hasReachedLimit}>
                        {isNative || isDesktop ? (
                            <button
                                type="button"
                                onMouseDown={preventBlur}
                                onClick={onTakePhoto}
                            >
                                <CameraIcon className="w-6 h-6" />
                            </button>
                        ) : (
                            <SocialChatCameraWeb />
                        )}
                        <label onMouseDown={preventBlur}>
                            <ImageIcon className="w-6 h-6" />
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                disabled={hasReachedLimit}
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </label>
                        <button
                            onMouseDown={preventBlur}
                            type="button"
                            onClick={handleTranslate}
                        >
                            {translateActionStatus ? (
                                <TranslateFocusIcon />
                            ) : (
                                <TranslateIcon />
                            )}
                        </button>
                    </button>
                </div>
                {translateActionStatus && (
                    <LanguageDropdown
                        open={open}
                        setOpen={setOpen}
                        selected={selectedLanguageSocialChat}
                        setSelected={setSelectedLanguageSocialChat}
                        languagesSocialChat={languagesSocialChat}
                        openModalTranslate={openModalTranslate}
                    />
                )}
            </div>
        </div>
    );
};

export default ChatInputBar;
