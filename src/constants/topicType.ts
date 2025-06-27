
export enum TopicType {
    MedicalSupport = 10,
    DocumentTranslation = 20,
    ProductInformation = 30,
    FoodDiscovery = 40,
    Chat = 50,
}

export const TopicTypeLabel: Record<TopicType, string> = {
    [TopicType.MedicalSupport]: t("Medical Support"),
    [TopicType.DocumentTranslation]: t("Document Translation"),
    [TopicType.ProductInformation]: t("Product Information"),
    [TopicType.FoodDiscovery]: t("Food Discovery"),
    [TopicType.Chat]: t("AI Assistant"),
};