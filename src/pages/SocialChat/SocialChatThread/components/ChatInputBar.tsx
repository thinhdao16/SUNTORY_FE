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
    setInputBarHeight

}) => {
    const [focused, setFocused] = useState({ input: false, translate: false });
    // const [actionStatus, setActionStatus] = useState<boolean>(false);
    const [translateActionStatus, setTranslateActionStatus] = useState<boolean>(false);
    const [open, setOpen] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const sendTranslateBtnRef = useRef<HTMLButtonElement>(null);
    const sendBtnRef = useRef<HTMLButtonElement>(null);

    const preventBlur = (e: React.MouseEvent) => e.preventDefault();

    const onFocus = (field: string) => {
        // setActionStatus(true);
        if (field === "input") {
            setFocused({ ...focused, [field]: true, translate: false });
            const textarea = messageRef.current;
            if (textarea) {
                textarea.focus();
                const len = textarea.value.length;
                textarea.setSelectionRange(len, len);
            }
        }
        if (field === "translate") {
            setFocused({ ...focused, [field]: true, input: false });
            const textareaTranslate = messageTranslateRef.current;
            if (textareaTranslate) {
                textareaTranslate.focus();
                const len = textareaTranslate.value.length;
                textareaTranslate.setSelectionRange(len, len);
            }
        }
        setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    };

    const onBlur = (field: string) => setFocused({ ...focused, [field]: false });
    // const handleOpenAction = () => {
    //     setActionStatus(false);
    // };

    const handleChangeInput = (value: string) => {
        setMessageValue(value);
    };
    const handleChangeTranslate = (v: string) => {
        setMessageTranslate(v);
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
                    <textarea
                        placeholder={t('Translate to...')}
                        ref={messageTranslateRef}
                        value={messageTranslate}
                        onChange={(e) => handleChangeTranslate(e.target.value)}
                        rows={1}
                        className={`flex-1 min-h-[35px] ${focused.translate
                            //    &&  actionStatus
                            ? 'max-h-20 overflow-y-auto whitespace-normal'
                            : '!max-h-[35px]  !truncate whitespace-nowrap overflow-hidden'
                            } min-w-0 max-w-full resize-none overflow-y-auto px-4 py-2 rounded-3xl focus:outline-none placeholder:text-netural-100-100`}
                        onFocus={() => onFocus('translate')}
                        onClick={() => onFocus('translate')}
                        onBlur={() => onBlur('translate')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendTranslateBtnRef.current?.click();
                            }
                        }}
                    />
                    <div className="pb-1 gap-4 flex items-center h-fit">
                        <button onClick={openTranslateExpandSheet}
                        >
                            <ExpandTranslateIcon />
                        </button>
                        {messageTranslate.trim() && (
                            <button
                                ref={sendTranslateBtnRef}
                                disabled={hasReachedLimit}
                                className="rounded-full p-2 flex items-center justify-center bg-chat-to"
                                type="button"
                                onClick={(e) => handleSendMessage(e, "inputTranslate", true)}
                            >
                                <SendTranslateIcon />
                            </button>
                        )}
                    </div>
                    {/* <button className="bg-chat-to rounded-full p-2 flex items-center justify-center">
                        <SendTranslateIcon />
                    </button> */}
                </div>
            )}
            <div className="flex items-end gap-4 transition-all py-2 px-6" onMouseDown={preventBlur}>
                <textarea
                    placeholder="Type a message..."
                    ref={messageRef}
                    value={messageValue}
                    onChange={(e) => handleChangeInput(e.target.value)}
                    rows={1}
                    className={`flex-1 min-h-[35px] ${focused.input
                        //    &&  actionStatus
                        ? 'max-h-30 overflow-y-auto whitespace-normal'
                        : '!max-h-[35px]  !truncate whitespace-nowrap overflow-hidden'
                        } min-w-0 max-w-full resize-none overflow-y-auto px-4 py-2 rounded-3xl bg-chat-to focus:outline-none placeholder:text-netural-100-100`}
                    onFocus={() => onFocus('input')}
                    onClick={() => onFocus('input')}
                    onBlur={() => onBlur('input')}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendBtnRef.current?.click();
                        }
                    }}
                    onPaste={async (e) => {
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
                            disabled={hasReachedLimit}
                            type="button"
                            onClick={(e) => handleSendMessage(e, "input", true)}
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
