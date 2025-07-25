import React from "react";
import { motion } from "framer-motion";
import BotIcon from "@/icons/logo/AI.svg?react";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import styles from "./StreamingMessage.module.css";

interface StreamingMessageChunkProps {
    msg: string;
}

const StreamingMessageChunk: React.FC<StreamingMessageChunkProps> = ({ msg }) => {
    return (
        <motion.div
            key="streaming"
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
                    <div className="bg-screen-page text-gray-900 rounded-[0px_16px_16px_16px]"
                        style={{ maxWidth: "calc(100vw - 80px)" }}>
                        <div className="overflow-x-auto w-full px-4 py-3 min-w-[60px] xl:max-w-[350px]">
                            <div className="prose prose-sm whitespace-break-spaces break-words text-[15px]">
                                <span className={styles.streamingText}>
                                    {/* <MarkdownRenderer text={msg} /> */}
                                    <span>
                                        {msg}
                                    </span>
                                </span>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default StreamingMessageChunk
