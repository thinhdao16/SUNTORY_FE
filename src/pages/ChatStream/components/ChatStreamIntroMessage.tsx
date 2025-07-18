import React from "react";
import { useTranslation } from "react-i18next";
import { TopicType } from "@/constants/topicType";
import { handleCopyToClipboard } from "@/components/common/HandleCoppy";
import { motion } from "framer-motion";
import BotIcon from "@/icons/logo/AI.svg?react";
import CopyIcon from "@/icons/logo/chat/coppy.svg?react";

const ChatStreamIntroMessage: React.FC<{ topicType: number }> = ({ topicType }) => {
    const { t } = useTranslation();

    if (topicType === TopicType.Chat) return null;

    // Render content with JSX for bold text support
    const renderIntroContent = () => {
        if (topicType === 10) {
            return (
                <div>

                    <div className="mb-4">
                        ❓ <strong>{t("Are you finding it difficult to understand the indicators and information in your health report?")}</strong>
                    </div>

                    <div className="mb-4">
                        👉 <strong>{t("We can assist you with the following features:")}</strong>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <strong>1. 📄 {t("Upload your health report")}</strong>
                            <div className="ml-4  text-gray-600">
                                {t("(It can be a photo 📷, screenshot 📱, or PDF file 📋)")}
                            </div>
                        </div>

                        <div>
                            <strong>2. 📊 {t("Automatically detect abnormal indicators")}</strong>
                            <div className="ml-4  text-gray-600">
                                {t("And highlight important values for your attention.")}
                            </div>
                        </div>

                        <div>
                            <strong>3. 🧠 {t("Explain medical terminology")}</strong>
                            <div className="ml-4  text-gray-600">
                                {t("In simple, easy-to-understand language.")}
                            </div>
                        </div>

                        <div>
                            <strong>4. 🌐 {t("Multilingual support")}</strong>
                            <div className="ml-4  text-gray-600">
                                {t("Including Vietnamese 🇻🇳, English 🇺🇸, French 🇫🇷, Japanese 🇯🇵, Korean 🇰🇷.")}
                            </div>
                        </div>

                        <div>
                            <strong>5. 🔍 {t("Provide preliminary health insights")}</strong>
                            <div className="ml-4  text-gray-600">
                                {t("Based on your data, helping you better understand your own condition.")}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (topicType === 20) {
            return (
                <div>

                    <div className="mb-4">
                        🤔 <strong>{t("Have you ever faced any of the following situations?")}</strong>
                    </div>

                    <div className="space-y-2 mb-4  text-gray-600">
                        <div>👉 {t("You received a contract in a foreign language at work or in daily life, but weren't sure if you fully understood it?")}</div>
                        <div>👉 {t("The terms in a user manual or insurance policy were too complex, and you were afraid of missing important risks?")}</div>
                        <div>👉 {t("You felt hesitant to sign a menu, service terms, or job offer documents because you didn't fully understand them?")}</div>
                    </div>

                    <div className="mb-4">
                        💡 <strong>{t("WayJet can help you handle these situations:")}</strong>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <strong>1. 📤 {t("Upload the document in any language (PDF, photo, or screenshot)")}</strong>
                        </div>

                        <div>
                            <strong>2. 🔄 {t("Our system will professionally translate it and highlight important clauses")}</strong>
                        </div>

                        <div>
                            <strong>3. ⚠️ {t("Get alerts for critical content such as:")}</strong>
                            <div className="ml-4 space-y-1  text-gray-600">
                                <div>• {t('"Full liability clauses"')}</div>
                                <div>• {t('"Contract termination conditions"')}</div>
                                <div>• {t('"Cost and fee details"')}</div>
                            </div>
                        </div>

                        <div>
                            <strong>4. 📖 {t("Receive a simplified explanation of each page,")}</strong>
                            <div className="ml-4  text-gray-600">
                                {t("so you can clearly understand the true meaning of the entire document.")}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (topicType === 30) {
            return (
                <div>

                    <div className="mb-4">
                        ❓ <strong>{t("Are you having trouble understanding the information in medication guides or drug packaging?")}</strong>
                    </div>

                    <div className="mb-4">
                        👉 <strong>{t("Let me help you with the following:")}</strong>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <strong>1. 📷 {t("Take a photo and upload the medication guide or packaging")}</strong>
                        </div>

                        <div>
                            <strong>2. 🔍 {t("Identify the drug name, its uses, instructions, and contraindications")}</strong>
                        </div>

                        <div>
                            <strong>3. 🌐 {t("Translate the content into a language you're familiar with")}</strong>
                            <div className="ml-4  text-gray-600">
                                → {t("To reduce the risk of misusing medication")}
                            </div>
                        </div>

                        <div>
                            <strong>4. 🔬 {t("Provide basic health insights")}</strong>
                            <div className="ml-4  text-gray-600">
                                → {t("Based on your input, helping you better understand your physical condition")}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (topicType === 40) {
            return (
                <div>

                    <div className="mb-4">
                        🛒 <strong>{t("Do you often find yourself in this situation at the supermarket or convenience store?")}</strong>
                    </div>

                    <div className="mb-4  text-gray-600">
                        {t("The ingredient list on the package is overwhelming, and the nutrition label is confusing?")}
                    </div>

                    <div className="mb-4">
                        👉 <strong>{t("WayJet can help you decode all that quickly and clearly.")}</strong>
                    </div>

                    <div className="mb-4">
                        <strong>{t("Here's how it works:")}</strong>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <strong>1. 📷 {t("Take a photo or upload the ingredient list or nutrition label from a food package")}</strong>
                        </div>

                        <div>
                            <strong>2. ✅ {t("The system automatically detects and translates key ingredients, additives, and allergens")}</strong>
                        </div>

                        <div>
                            <strong>3. ⚠️ {t("Get alerts if the product contains ingredients that conflict with your health condition")}</strong>
                            <div className="ml-4  text-gray-600">
                                {t("(e.g., high sugar, saturated fats, or common allergens)")}
                            </div>
                        </div>

                        <div>
                            <strong>4. 🥗 {t("Receive a nutritional evaluation and usage recommendation")}</strong>
                            <div className="ml-4  text-gray-600">
                                {t('(e.g., "occasionally acceptable", "should be limited")')}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

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
                <div className="w-full relative bg-chat-to rounded-[0px_16px_16px_16px] px-4 py-3 text-[15px] text-gray-700">
                    {renderIntroContent()}
                </div>
            </div>
            <div className="flex justify-end mt-1">
                <button
                    className="transition"
                    type="button"
                    onClick={() => {
                        const textContent = document.querySelector('.bg-chat-to')?.textContent || '';
                        handleCopyToClipboard(textContent);
                    }}
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

export default ChatStreamIntroMessage;