import PendingImages from "./PendingImages";
import PendingFiles from "./PendingFiles";
import { t } from "@/lib/globalT";
import { quickActions } from "../data";
import React from "react";

const ChatWelcomePanel: React.FC<{
    pendingImages: any[];
    pendingFiles: any[];
    uploadImageMutation: any;
    removePendingImage: (idx: number) => void;
    removePendingFile: (idx: number) => void;
    messageValue: string;
    setMessageValue: (v: string) => void;
    isLoading: boolean;
    isSending: boolean;
    handleImageChange: (e: any) => void;
    handleFileChange: (e: any) => void;
    handleSendMessage: (e: any, force?: boolean) => void;
    history: any;
    messageRef: React.RefObject<HTMLTextAreaElement>;
}> = ({
    pendingImages,
    pendingFiles,
    uploadImageMutation,
    removePendingImage,
    removePendingFile,
    messageValue,
    setMessageValue,
    isLoading,
    isSending,
    handleImageChange,
    handleFileChange,
    handleSendMessage,
    history,
    messageRef,
}) => (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex items-center gap-2 mb-4 ">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-100">
                    <img src="/logo/AI.svg" alt="bot" />
                </span>
                <span className="text-[22px] font-bold text-main">{t("How can I help you?")}</span>
            </div>
            <div className="w-full mx-auto bg-white rounded-2xl shadow-[0px_2px_4px_2px_#0000001A] px-6 py-4 flex flex-col gap-2">
                <div className="flex gap-2 flex-wrap">
                    <PendingImages
                        pendingImages={pendingImages}
                        imageLoading={uploadImageMutation.isLoading}
                        removePendingImage={removePendingImage}
                    />
                    <PendingFiles
                        pendingFiles={pendingFiles}
                        removePendingFile={removePendingFile}
                    />
                </div>
                <textarea
                    placeholder={t("Enter your message...")}
                    value={messageValue}
                    disabled={isLoading}
                    ref={messageRef}
                    onChange={(e) => setMessageValue(e.target.value)}
                    className="focus:outline-none resize-none max-h-[230px] overflow-y-auto"
                    rows={1}
                    onFocus={() => {
                        setTimeout(() => {
                            window.dispatchEvent(new Event("resize"));
                        }, 200);
                    }}
                />
                <div className="flex justify-between items-center">
                    <div className="flex gap-6">
                        <button onClick={() => history.push("/take-photo")}>
                            <img src="/logo/chat/cam.svg" alt={t("camera")} />
                        </button>
                        <label>
                            <img src="logo/chat/image.svg" alt={t("image")} />
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </label>
                        <label>
                            <img src="logo/chat/file.svg" alt={t("file")} />
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => handleSendMessage(e, true)}
                        disabled={isSending || (!messageValue.trim() && pendingImages.length === 0 && pendingFiles.length === 0)}
                    >
                        <img src="logo/chat/send.svg" alt={t("send")} />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full mt-8">
                {quickActions.map((item) => (
                    <button
                        key={item.to}
                        className="flex items-center gap-4 p-4 rounded-3xl w-full  bg-white shadow-[0px_2px_2px_2px_#0000001A] transition hover:shadow-md"
                        onClick={() => history.push(item.to)}
                    >
                        <span className="inline-flex items-center justify-center rounded-full ">
                            <img src={item.icon} alt={item.alt} className="w-8 aspect-square " />
                        </span>
                        <span className="font-semibold text-main text-left leading-none break-words line-clamp-2">
                            {t(item.label)}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );

export default ChatWelcomePanel;