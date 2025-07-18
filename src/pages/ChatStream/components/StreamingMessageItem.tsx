/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { motion } from "framer-motion";
import BotIcon from "@/icons/logo/AI.svg?react";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import { useBatchedTypingEffect } from "@/hooks/useBatchedTypingEffect";
import styles from "./StreamingMessage.module.css";

interface StreamingMessageItemProps {
    msg: any;
}

const StreamingMessageItem: React.FC<StreamingMessageItemProps> = ({ msg }) => {
    console.log(msg)
    // Ensure we get text from the correct property
    let fullText = '';
    if (typeof msg.text === 'string') {
        fullText = msg.text;
    } else if (msg.partialText) {
        fullText = msg.partialText;
    } else if (msg.chunks && Array.isArray(msg.chunks)) {
        fullText = msg.chunks.map((chunk: any) => chunk.chunk).join('');
    }

    const { displayText, isTyping } = useBatchedTypingEffect(fullText, msg.isComplete, {
        charDelay: 6,
        batchSize: 1,
        batchDelay: 15
    });

    if (!msg) return null;

    return (
        <motion.div
            key={msg.id || msg.messageCode || 'streaming'}
            className="flex w-full mb-4 justify-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
            <div className="flex gap-2 items-start w-full">
                <div>
                    <BotIcon className="min-w-[30px] aspect-square object-contain" />
                </div>
                <div className="flex-1 flex flex-col">
                    <div
                        className="bg-screen-page text-gray-900 rounded-[0px_16px_16px_16px]"
                        style={{ maxWidth: "calc(100vw - 80px)" }}
                    >
                        <div className="overflow-x-auto w-full px-4 py-3 min-w-[60px] xl:max-w-[350px]">
                            <div className="prose prose-sm whitespace-break-spaces break-words text-[15px]">
                                <span className={styles.streamingText}>
                                    <MarkdownRenderer text={displayText} />
                                </span>
                                {(msg.isStreaming && !msg.isComplete && displayText) || isTyping ? (
                                    <span className={styles.streamingCursor} />
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {/* Show completion indicator */}
                    {msg.isComplete && (
                        <div className="text-xs text-gray-400 mt-1 px-1">
                            ✓ Complete
                        </div>
                    )}

                    {/* Show error if any */}
                    {msg.hasError && (
                        <div className="text-xs text-red-500 mt-1 px-1">
                            ⚠ Error occurred
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default React.memo(StreamingMessageItem);
