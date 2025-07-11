import MedicalSupportIcon from "@/icons/logo/chat/medical_support.svg?react";
import DocumentTranslationIcon from "@/icons/logo/chat/contract_translation.svg?react";
import DrugInstructionsIcon from "@/icons/logo/chat/product_information.svg?react";
import FoodDiscoveryIcon from "@/icons/logo/chat/food_discovery.svg?react";
import { TopicType } from "@/constants/topicType";
export const quickActions = [
    {
        icon: MedicalSupportIcon,
        label: "Medical Support",
        to: `/chat/${TopicType.MedicalSupport}`,
        topicId: TopicType.MedicalSupport,
    },
    {
        icon: DocumentTranslationIcon,
        label: "Document Translation",
        to: `/chat/${TopicType.DocumentTranslation}`,
        topicId: TopicType.DocumentTranslation,
    },
    {
        icon: DrugInstructionsIcon,
        label: "Drug Instructions",
        to: `/chat/${TopicType.DrugInstructions}`,
        topicId: TopicType.DrugInstructions,
    },
    {
        icon: FoodDiscoveryIcon,
        label: "Food Discovery",
        to: `/chat/${TopicType.FoodDiscovery}`,
        topicId: TopicType.FoodDiscovery,
    },
];