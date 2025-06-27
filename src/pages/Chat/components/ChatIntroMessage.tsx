import React from "react";
import { TopicType } from "@/constants/topicType";

const ChatIntroMessage: React.FC<{ topicType: number }> = ({ topicType }) => {
    if (topicType === TopicType.Chat) return null;
    return (
        <div>
            <div className="flex gap-2 items-start w-fit">
                <div>
                    <img src="/logo/AI.svg" alt="bot" className="min-w-[30px] aspect-square object-contain" />
                </div>
                <div className="bg-chat-to rounded-[16px_16px_16px_0px] px-4 py-3 text-[15px] text-gray-700 whitespace-pre-line">
                    {topicType === 10 && (
                        <>
                            🏥 <b>{t("Medical Support")}</b>
                            <br /><br />
                            📤 {t("How to use:")}
                            <br />
                            1️⃣ {t("Upload health reports, lab results, medical documents")}
                            <br />
                            2️⃣ {t("I'll translate complex medical terms into simple language")}
                            <br />
                            3️⃣ {t("Get personalized health advice & warnings")}
                            <br /><br />
                            🎯 {t("What I do:")}
                            <br />
                            🔤 {t("Translate complex medical terms into simple language")}
                            <br />
                            📊 {t("Explain your health indicators clearly")}
                            <br />
                            ⚠️ {t("Provide personalized health advice & warnings")}
                            <br /><br />
                            💡 {t("Perfect for: Understanding your medical reports, lab results, health checkups")}
                            <br /><br />
                            ✨ {t("Ready to start?")}
                        </>
                    )}
                    {topicType === 20 && (
                        <>
                            📋 <b>{t("Document Translation")}</b>
                            <br /><br />
                            📤 {t("How to use:")}
                            <br />
                            1️⃣ {t("Upload contracts, legal documents, official papers")}
                            <br />
                            2️⃣ {t("I'll translate documents accurately & highlight key terms")}
                            <br />
                            3️⃣ {t("Receive alerts about potential risks or important points")}
                            <br /><br />
                            🎯 {t("What I do:")}
                            <br />
                            🌐 {t("Translate documents accurately")}
                            <br />
                            🔍 {t("Highlight important clauses & terms")}
                            <br />
                            🚨 {t("Alert you to potential risks or key points")}
                            <br /><br />
                            💡 {t("Perfect for: Legal contracts, business agreements, official forms")}
                            <br /><br />
                            ✨ {t("Ready to start?")}
                        </>
                    )}
                    {topicType === 30 && (
                        <>
                            💊 <b>{t("Product Information")}</b>
                            <br /><br />
                            📤 {t("How to use:")}
                            <br />
                            1️⃣ {t("Upload medicine labels, drug instructions, product manuals")}
                            <br />
                            2️⃣ {t("I'll simplify medication instructions & explain dosage")}
                            <br />
                            3️⃣ {t("Get clear safety warnings & precautions")}
                            <br /><br />
                            🎯 {t("What I do:")}
                            <br />
                            📋 {t("Simplify medication instructions")}
                            <br />
                            💊 {t("Explain dosage & usage clearly")}
                            <br />
                            🛡️ {t("Provide safety warnings & precautions")}
                            <br /><br />
                            💡 {t("Perfect for: Understanding medication, supplement instructions, drug safety")}
                            <br /><br />
                            ✨ {t("Ready to start?")}
                        </>
                    )}
                    {topicType === 40 && (
                        <>
                            🍎 <b>{t("Food Discovery")}</b>
                            <br /><br />
                            📤 {t("How to use:")}
                            <br />
                            1️⃣ {t("Upload photos of food items, ingredients, dishes")}
                            <br />
                            2️⃣ {t("I'll identify food items instantly & suggest recipes")}
                            <br />
                            3️⃣ {t("Receive personalized nutrition advice")}
                            <br /><br />
                            🎯 {t("What I do:")}
                            <br />
                            🔍 {t("Identify food items instantly")}
                            <br />
                            👨‍🍳 {t("Suggest delicious recipes")}
                            <br />
                            🥗 {t("Offer personalized nutrition advice")}
                            <br /><br />
                            💡 {t("Perfect for: Cooking inspiration, nutritional guidance, meal planning")}
                            <br /><br />
                            ✨ {t("Ready to start?")}
                        </>
                    )}
                </div>
            </div>
            <hr className="border-netural-100 my-6 h-[0.52px]" />
        </div>
    );
};

export default ChatIntroMessage;