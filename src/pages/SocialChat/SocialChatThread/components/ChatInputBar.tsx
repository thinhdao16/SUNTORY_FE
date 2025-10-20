import React, { useState, useEffect, useRef } from "react";
import CameraIcon from "@/icons/logo/chat/cam.svg?react";
import ImageIcon from "@/icons/logo/chat/image.svg?react";
import SendIcon from "@/icons/logo/social-chat/send.svg?react";
import ExpandInputIcon from "@/icons/logo/social-chat/expland-input.svg?react";
import TranslateIcon from "@/icons/logo/social-chat/translate.svg?react";
import TranslateFocusIcon from "@/icons/logo/social-chat/translate-focus.svg?react";
import LanguageDropdown from "./LanguageDropdown";
import { Language } from "@/store/zustand/language-store";
import { ChatMessage } from "@/types/social-chat";
import ReplyMessageBar from "./ReplyMessageBar";
import SocialChatCameraWeb from "../../SocialChatCamera/SocialChatCameraWeb";
import SocialChatCameraWithPending from "./SocialChatCameraWithPending";
import { useDebounce } from "@/hooks/useDebounce";
import { t } from "@/lib/globalT";
import { PendingFile } from "./PendingFilesList";

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
  onOpenGallery?: () => void;
  onCameraResult?: (file: File) => void;
  roomId?: string;
  uploadImageMutation: any;
  addPendingImages: (images: string[]) => void;
  pendingFiles?: PendingFile[];
  onRemovePendingFile?: (id: string) => void;
  onRetryUpload?: (id: string) => void;
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
  onTranslate: (text: string) => Promise<void>;
  setInputBarHeight: (h: number) => void;
  actionFieldSend: string;
  isTranslating: boolean;
  translateActionStatus: boolean;
  setTranslateActionStatus: (value: boolean) => void;
  typing: TypingAPI;
  isNative: boolean;
}

const ChatInputBar: React.FC<ChatInputBarProps> = (props) => {
  const {
    messageValue, setMessageValue, messageRef,
    handleSendMessage, handleImageChange, onTakePhoto, onOpenGallery, onCameraResult, roomId,
    uploadImageMutation, addPendingImages, pendingFiles, onRemovePendingFile, onRetryUpload, isDesktop,
    messageTranslate, setMessageTranslate, openModalTranslate,
    selectedLanguageSocialChat, languagesSocialChat, setSelectedLanguageSocialChat,
    replyingToMessage, setReplyingToMessage, onCancelReply, messageTranslateRef,
    hasReachedLimit, openInputExpandSheet, openTranslateExpandSheet, onTranslate,
    setInputBarHeight, actionFieldSend, isTranslating,
    translateActionStatus, setTranslateActionStatus, typing
  } = props;

  const [focused, setFocused] = useState({ input: false, translate: false });
  const [open, setOpen] = useState(false);
  const [dots, setDots] = useState(".");
  const [isSending, setIsSending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sendBtnRef = useRef<HTMLButtonElement>(null);
  const lastSentTimeRef = useRef<number>(0);

  const composingRef = useRef(false);
  const typingIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const forceTypingOff = () => {
    if (typingIdleTimerRef.current) {
      clearTimeout(typingIdleTimerRef.current);
      typingIdleTimerRef.current = null;
    }
    typing.setStatus?.("off");
    typing.off?.();
  };

  const handleTypingActivity = () => {
    typing.touch?.();
    if (typingIdleTimerRef.current) clearTimeout(typingIdleTimerRef.current);
    typingIdleTimerRef.current = setTimeout(() => {
      if (!composingRef.current) forceTypingOff();
    }, 1500);
  };

  useEffect(() => () => forceTypingOff(), []);

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
    if (isTranslating) {
      let i = 1;
      const id = setInterval(() => {
        i = (i % 3) + 1;
        setDots(".".repeat(i));
      }, 300);
      return () => clearInterval(id);
    }
  }, [isTranslating]);

  // autosize textareas
  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.style.height = "auto";
      messageRef.current.style.height = `${messageRef.current.scrollHeight}px`;
    }
  }, [messageValue, focused]);
  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.style.height = "auto";
      messageRef.current.style.height = `${messageRef.current.scrollHeight}px`;
    }
    if (messageTranslateRef.current) {
      messageTranslateRef.current.style.height = "auto";
      messageTranslateRef.current.style.height = `${messageTranslateRef.current.scrollHeight}px`;
    }
  }, [messageValue, messageTranslate, focused]);

  // dịch tự động – debounce 900ms, không chạy khi IME
  const debouncedSource = useDebounce(messageValue, 900);
  useEffect(() => {
    if (!translateActionStatus) return;
    if (composingRef.current) return;
    if (!debouncedSource.trim()) return;
    void onTranslate(debouncedSource);
  }, [translateActionStatus, debouncedSource, selectedLanguageSocialChat]);

  // clear replying khi gõ
  useEffect(() => {
    if (replyingToMessage && props.setReplyingToMessage) {
      props.setReplyingToMessage(null);
    }
  }, [props.setReplyingToMessage, replyingToMessage]);

  const preventBlur = (e: React.SyntheticEvent) => e.preventDefault();

  // gửi có debounce 300ms
  const handleSendWithDebounce = async (e: any, field: string, force?: boolean) => {
    const now = Date.now();
    if (now - lastSentTimeRef.current < 300 || isSending) return;
    setIsSending(true);
    lastSentTimeRef.current = now;
    forceTypingOff();
    try {
      await handleSendMessage(e, field, force);
    } finally {
      setTimeout(() => setIsSending(false), 1);
    }
  };

  const onFocus = (field: "input" | "translate") => {
    setFocused({ input: field === "input", translate: field === "translate" });
    const ta = field === "input" ? messageRef.current : messageTranslateRef.current;
    if (ta) {
      ta.focus();
      const len = ta.value.length;
      ta.setSelectionRange(len, len);
    }
    setTimeout(() => window.dispatchEvent(new Event("resize")), 100);
  };

  const onBlur = (field: "input" | "translate") => {
    setFocused((prev) => ({ ...prev, [field]: false }));
    // forceTypingOff();
  };
  const handleChangeInput = (v: string) => {
    setMessageValue(v);
    if (v.trim()) handleTypingActivity();
    else forceTypingOff();
    if (!v.trim()) setMessageTranslate("");
  };

  const handleChangeTranslate = (v: string) => {
    setMessageTranslate(v);
    if (v.trim()) handleTypingActivity();
    else forceTypingOff();
  };

  const handleTranslate = () => setTranslateActionStatus(!translateActionStatus);

  return (
    <div ref={containerRef} className={`pb-1 bg-white relative ${hasReachedLimit ? "pointer-events-none opacity-50" : ""}`}>
      {/* Pending Files List */}
      {pendingFiles && pendingFiles.length > 0 && (
        <div className="px-4 py-3 bg-white border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {pendingFiles.map((file) => (
              <div key={file.id} className="relative group">
                {/* File Preview */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 relative">
                  {file.type === 'image' && file.url ? (
                    <img 
                      src={file.url} 
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : file.type === 'video' && file.url ? (
                    <div className="relative w-full h-full">
                      <video 
                        src={file.url}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Upload progress overlay */}
                  {file.isUploading && (
                    <div className="absolute inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-xs font-medium">
                        {file.progress ? `${file.progress}%` : '...'}
                      </div>
                    </div>
                  )}
                  
                  {/* Error overlay */}
                  {file.error && (
                    <div className="absolute inset-0 bg-red-500 bg-opacity-80 flex items-center justify-center">
                      <div className="text-white text-xs font-medium text-center px-1">
                        Lỗi
                      </div>
                    </div>
                  )}
                </div>

                {/* Remove button */}
                <button
                  onClick={() => onRemovePendingFile?.(file.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
                >
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>

                {/* Progress bar at bottom */}
                {file.isUploading && file.progress !== undefined && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {replyingToMessage && (
        <ReplyMessageBar replyingToMessage={replyingToMessage} onCancelReply={onCancelReply ?? (() => {})} />
      )}

      {translateActionStatus && (
        <div className="flex items-end gap-4 px-4 py-2 border-t-1 border-netural-50">
          <div className="relative flex-1">
            {isTranslating && !messageTranslate && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-netural-200 pointer-events-none flex">
                {t("Translating")}
                <span className="flex">{dots.split("").map((d, i) => (
                  <span key={i} className="animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}>{d}</span>
                ))}</span>
              </div>
            )}
            <textarea
              placeholder={isTranslating ? "" : t("Translate to...")}
              ref={messageTranslateRef}
              value={messageTranslate}
              onChange={(e) => handleChangeTranslate(e.target.value)}
              rows={1}
              disabled={hasReachedLimit || isTranslating}
              className={`flex-1 w-full min-h-[35px] ${focused.translate ? "max-h-20 overflow-y-auto whitespace-normal" : "!max-h-[35px] !truncate whitespace-nowrap overflow-hidden"} min-w-0 max-w-full resize-none overflow-y-auto px-4 pt-4 rounded-3xl focus:outline-none placeholder:text-netural-200`}
              onFocus={() => onFocus("translate")}
              onClick={() => onFocus("translate")}
              onBlur={() => onBlur("translate")}
              onCompositionStart={() => { composingRef.current = true; handleTypingActivity(); }}
              onCompositionEnd={(e) => { composingRef.current = false; e.currentTarget.value.trim() ? handleTypingActivity() : forceTypingOff(); }}
              onKeyDown={(e) => {
                if (hasReachedLimit) return;
                const ev = e as unknown as { key: string; shiftKey: boolean; preventDefault: () => void; stopPropagation: () => void; };
                if (ev.key === "Enter" && !ev.shiftKey) {
                  if (composingRef.current) return;
                  e.preventDefault(); e.stopPropagation();
                  if (messageTranslate.trim() && !isSending) {
                    handleSendWithDebounce(e, "inputTranslate", true);
                  }
                  setMessageTranslate("");
                }
              }}
            />
          </div>

          <div className="gap-4 flex items-center h-fit pb-2">
            <button onClick={openTranslateExpandSheet}><ExpandInputIcon /></button>
            {( (messageValue.trim() || messageTranslate.trim() || (pendingFiles && pendingFiles.length > 0)) && translateActionStatus ) && (
              <button
                ref={sendBtnRef}
                type="button"
                disabled={hasReachedLimit || isSending}
                onMouseDown={preventBlur}
                onTouchStart={preventBlur}
                onClick={(e) => {
                  if (isSending) return;
                  if (!messageValue.trim() && !messageTranslate.trim() && (!pendingFiles || pendingFiles.length === 0)) return;
                  handleSendWithDebounce(e, actionFieldSend, false);
                  if (!pendingFiles || pendingFiles.length === 0) {
                    setMessageValue("");
                  }
                }}
                className={pendingFiles && pendingFiles.some(f => f.isUploading) ? "opacity-50" : ""}
              >
                <SendIcon />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex items-end gap-4 transition-all py-2 px-4" onMouseDown={preventBlur}>
        <textarea
          placeholder={t("Type a message...")}
          ref={messageRef}
          value={messageValue}
          onChange={(e) => handleChangeInput(e.target.value)}
          rows={1}
          disabled={hasReachedLimit}
          data-virtualkeyboard="true"
          className={`flex-1 min-h-[35px] ${focused.input ? "max-h-30 overflow-y-auto whitespace-normal" : "!max-h-[35px] !truncate whitespace-nowrap overflow-hidden"} min-w-0 max-w-full resize-none overflow-y-auto px-4 py-2 rounded-3xl bg-chat-to focus:outline-none placeholder:text-netural-100-100`}
          onFocus={() => onFocus("input")}
          onClick={() => onFocus("input")}
          onBlur={() => onBlur("input")}
          onCompositionStart={() => { composingRef.current = true; handleTypingActivity(); }}
          onCompositionEnd={(e) => { composingRef.current = false; e.currentTarget.value.trim() ? handleTypingActivity() : forceTypingOff(); }}
          onKeyDown={(e) => {
            if (hasReachedLimit) return;
            const ev = e as unknown as { key: string; shiftKey: boolean; preventDefault: () => void; stopPropagation: () => void; };
            if (ev.key === "Enter" && !ev.shiftKey) {
              if (composingRef.current) return;
              e.preventDefault(); e.stopPropagation();
              if (messageValue.trim() && !isSending) {
                handleSendWithDebounce(e, actionFieldSend, false);
              }
              setMessageValue("");
            }
          }}
          onPaste={async (e) => {
            const items = e.clipboardData?.items; if (!items) return;
            for (const item of items) {
              if (item.type.startsWith("image/")) {
                const file = item.getAsFile();
                if (file) {
                  const uploaded = await uploadImageMutation.mutateAsync(file);
                  if (uploaded?.length) addPendingImages([uploaded[0].linkImage]);
                }
              }
            }
          }}
        />
        <div className="pb-2 gap-4 flex items-center h-fit">
          <button onClick={openInputExpandSheet}><ExpandInputIcon /></button>
          {( (messageValue.trim() || messageTranslate.trim() || (pendingFiles && pendingFiles.length > 0)) && !translateActionStatus ) && (
            <button
              ref={sendBtnRef}
              type="button"
              disabled={hasReachedLimit || isSending}
              onMouseDown={preventBlur}
              onTouchStart={preventBlur}
              onClick={(e) => {
                if (isSending) return;
                if (!messageValue.trim() && !messageTranslate.trim() && (!pendingFiles || pendingFiles.length === 0)) return;
                handleSendWithDebounce(e, actionFieldSend, false);
                if (!pendingFiles || pendingFiles.length === 0) {
                  setMessageValue("");
                }
              }}
              className={pendingFiles && pendingFiles.some(f => f.isUploading) ? "opacity-50" : ""}
            >
              <SendIcon />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pt-2">
        <div className="flex space-x-4">
          {/* Camera Button */}
      
            <SocialChatCameraWithPending 
              onCameraResult={onCameraResult}
              disabled={!!hasReachedLimit}
            />

          {/* BACKUP - Original Camera Button code (same as current, for reference):
          {isDesktop ? (
            <button type="button" onMouseDown={preventBlur} onClick={onTakePhoto} title={t("Take Photo")}>
              <CameraIcon className="w-6 h-6" />
            </button>
          ) : <SocialChatCameraWeb />}
          */}

          {/* Gallery Button */}
          {onOpenGallery && (
            <button 
              type="button" 
              onMouseDown={preventBlur} 
              onClick={onOpenGallery}
              title={t("Select Photos/Videos")}
              className="hover:bg-gray-100 p-1 rounded-full transition-colors"
            >
              <ImageIcon className="w-6 h-6" />
            </button>
          )}

          {/* BACKUP - Original Image Upload code (hidden for future use):
          <label onMouseDown={preventBlur} title={t("Upload Images")} className="hover:bg-gray-100 p-1 rounded-full transition-colors cursor-pointer">
            <ImageIcon className="w-6 h-6 opacity-60" />
            <input type="file" accept="image/*" multiple disabled={!!hasReachedLimit} className="hidden" onChange={handleImageChange} />
          </label>
          */}

          <button onMouseDown={preventBlur} type="button" onClick={() => setTranslateActionStatus(!translateActionStatus)}>
            {translateActionStatus ? <TranslateFocusIcon /> : <TranslateIcon />}
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
