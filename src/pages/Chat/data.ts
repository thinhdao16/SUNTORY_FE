import MedicalSupportIcon from "@/icons/logo/chat/medical_support.svg?react";
import DocumentTranslationIcon from "@/icons/logo/chat/contract_translation.svg?react";
import ProductInformationIcon from "@/icons/logo/chat/product_information.svg?react";
import FoodDiscoveryIcon from "@/icons/logo/chat/food_discovery.svg?react";

export const quickActions = [
    {
        to: "/chat/10",
        iconBg: "bg-blue-100",
        icon: MedicalSupportIcon,
        label: "Medical Support",
        alt: "Medical Support",
    },
    {
        to: "/chat/20",
        iconBg: "bg-green-100",
        icon: DocumentTranslationIcon,
        label: "Document Translation",
        alt: "Document Translation",
    },
    {
        to: "/chat/30",
        iconBg: "bg-orange-100",
        icon: ProductInformationIcon,
        label: "Product Information",
        alt: "Product Information",
    },
    {
        to: "/chat/40",
        iconBg: "bg-red-100",
        icon: FoodDiscoveryIcon,
        label: "Food Discovery",
        alt: "Food Discovery",
    },
];