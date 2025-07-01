import React from "react";
import { useTranslation } from "react-i18next";
import { TopicType } from "@/constants/topicType";
import { handleCopyToClipboard } from "@/components/common/HandleCoppy";
import { motion } from "framer-motion";
import BotIcon from "@/icons/logo/AI.svg?react";
import CopyIcon from "@/icons/logo/chat/coppy.svg?react";

const ChatIntroMessage: React.FC<{ topicType: number }> = ({ topicType }) => {
    const { t } = useTranslation();

    if (topicType === TopicType.Chat) return null;

    // Tạo nội dung introText theo topicType, dùng i18n
    let introText = "";
    if (topicType === 10) {
        introText = `🏥 ${t("Medical Support")}

📤 ${t("How to use:")}
1️⃣ ${t("Upload health reports, lab results, medical documents")}
2️⃣ ${t("I'll translate complex medical terms into simple language")}
3️⃣ ${t("Get personalized health advice & warnings")}

🎯 ${t("What I do:")}
🔤 ${t("Translate complex medical terms into simple language")}
📊 ${t("Explain your health indicators clearly")}
⚠️ ${t("Provide personalized health advice & warnings")}

💡 ${t("Perfect for: Understanding your medical reports, lab results, health checkups")}

✨ ${t("Ready to start?")}`;
    }
    if (topicType === 20) {
        introText = `📋 ${t("Document Translation")}

📤 ${t("How to use:")}
1️⃣ ${t("Upload contracts, legal documents, official papers")}
2️⃣ ${t("I'll translate documents accurately & highlight key terms")}
3️⃣ ${t("Receive alerts about potential risks or important points")}

🎯 ${t("What I do:")}
🌐 ${t("Translate documents accurately")}
🔍 ${t("Highlight important clauses & terms")}
🚨 ${t("Alert you to potential risks or key points")}

💡 ${t("Perfect for: Legal contracts, business agreements, official forms")}

✨ ${t("Ready to start?")}`;
    }
    if (topicType === 30) {
        introText = `💊 ${t("Product Information")}

📤 ${t("How to use:")}
1️⃣ ${t("Upload medicine labels, drug instructions, product manuals")}
2️⃣ ${t("I'll simplify medication instructions & explain dosage")}
3️⃣ ${t("Get clear safety warnings & precautions")}

🎯 ${t("What I do:")}
📋 ${t("Simplify medication instructions")}
💊 ${t("Explain dosage & usage clearly")}
🛡️ ${t("Provide safety warnings & precautions")}

💡 ${t("Perfect for: Understanding medication, supplement instructions, drug safety")}

✨ ${t("Ready to start?")}`;
    }
    if (topicType === 40) {
        introText = `🍎 ${t("Food Discovery")}

📤 ${t("How to use:")}
1️⃣ ${t("Upload photos of food items, ingredients, dishes")}
2️⃣ ${t("I'll identify food items instantly & suggest recipes")}
3️⃣ ${t("Receive personalized nutrition advice")}

🎯 ${t("What I do:")}
🔍 ${t("Identify food items instantly")}
👨‍🍳 ${t("Suggest delicious recipes")}
🥗 ${t("Offer personalized nutrition advice")}

💡 ${t("Perfect for: Cooking inspiration, nutritional guidance, meal planning")}

✨ ${t("Ready to start?")}`;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
            <div className="flex gap-2 items-start w-full">
                <div>
                    <BotIcon className="min-w-[30px] aspect-square object-contain" />
                </div>
                <div className="w-full relative bg-chat-to rounded-[0px_16px_16px_16px] px-4 py-3 text-[15px] text-gray-700 whitespace-pre-line">
                    {introText}
                </div>
            </div>
            <div className="flex justify-end mt-1">
                <button
                    className="transition"
                    type="button"
                    onClick={() => handleCopyToClipboard(introText)}
                    title={t("Copy")}
                >
                    <CopyIcon />
                </button>
            </div>
            <motion.hr
                className="border-netural-100 my-6 h-[0.52px] origin-left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                style={{ transformOrigin: "left" }}
            />
        </motion.div>
    );
};

export default ChatIntroMessage;