/* eslint-disable @typescript-eslint/no-explicit-any */
import PendingImages from "./PendingImages";
import PendingFiles from "./PendingFiles";
import { t } from "@/lib/globalT";
import { quickActions } from "../data";
import React from "react";

// Import SVG as React component
import BotIcon from "@/icons/logo/AI.svg?react";
import CameraIcon from "@/icons/logo/chat/cam.svg?react";
import ImageIcon from "@/icons/logo/chat/image.svg?react";
import SendIcon from "@/icons/logo/chat/send.svg?react";
import CameraWeb from "@/pages/Camera/CameraWeb";

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
    addPendingImages: (images: string[]) => void;
    isNative?: boolean;
    isDesktop?: boolean;
    uploadLoading?: boolean;
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
    handleSendMessage,
    history,
    messageRef,
    addPendingImages,
    isNative,
    isDesktop,
    uploadLoading
}) => {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="flex items-center gap-2 mb-4 ">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-100">
                        <BotIcon />
                    </span>
                    <span className="text-[22px] font-bold text-main">{t("How can I help you?")}</span>
                </div>
                <div className="w-full mx-auto bg-white rounded-2xl shadow-[0px_2px_4px_2px_#0000001A] px-6 py-4 flex flex-col gap-2">
                    <div className="flex gap-2 flex-wrap">
                        <PendingImages
                            pendingImages={pendingImages}
                            imageLoading={uploadImageMutation.isLoading}
                            removePendingImage={removePendingImage}
                            imageLoadingMany={!!uploadLoading}
                        />
                        <PendingFiles
                            pendingFiles={pendingFiles}
                            removePendingFile={removePendingFile}
                        />
                    </div>
                    <textarea
                        placeholder={t("Enter your message...")}
                        value={messageValue}
                        disabled={isLoading || isSending || uploadImageMutation.isLoading || uploadLoading}
                        ref={messageRef}
                        onChange={(e) => setMessageValue(e.target.value)}
                        className="focus:outline-none resize-none max-h-[230px] overflow-y-auto"
                        rows={1}
                        onFocus={() => {
                            setTimeout(() => {
                                window.dispatchEvent(new Event("resize"));
                            }, 200);
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
                    <div className="flex justify-between items-center">
                        <div className="flex gap-6">
                            {(isNative || isDesktop) ? (
                                <button onClick={() => history.push("/camera")}>
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
                                />
                            </label>
                        </div>
                        {/* <label>
                            <FileIcon aria-label={t("file")} />
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label> */}
                        <button
                            type="button"
                            onClick={(e) => handleSendMessage(e, true)}
                            disabled={uploadImageMutation.isLoading || isSending || (!messageValue.trim() && pendingImages.length === 0 && pendingFiles.length === 0) || uploadLoading}
                        >
                            <SendIcon aria-label={t("send")} />
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full mt-8">
                    {quickActions.map((item) => {
                        const Icon = item.icon;
                        const getItemLink = () => {
                            if (item.topicId) {
                                // Điều hướng trực tiếp với topic
                                return `/chat/${item.topicId}`;
                            }
                            return typeof item.to === 'function'
                                ? (item.to as (() => string))()
                                : item.to;
                        };
                        return (
                            <button
                                key={item.label}
                                className="flex items-center gap-4 p-4 rounded-3xl w-full  bg-white shadow-[0px_2px_2px_2px_#0000001A] transition hover:shadow-md"
                                onClick={() => history.push(getItemLink(), {
                                    actionFrom: '/chat/50',
                                })}>
                                <span className="inline-flex items-center justify-center rounded-full ">
                                    {Icon ? <Icon className="w-[30px] h-[30px]" /> : null}
                                </span>
                                <span className="font-semibold text-main text-left ">
                                    {t(item.label)}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

export default ChatWelcomePanel;