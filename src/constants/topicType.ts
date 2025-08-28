
export enum TopicType {
    MedicalSupport = 10,
    DocumentTranslation = 20,
    // ProductInformation = 60,
    DrugInstructions = 30,
    FoodDiscovery = 40,
    Chat = 50,
    MenuTranslation = 60,
}

export const TopicTypeLabel: Record<TopicType, string> = {
    [TopicType.MedicalSupport]: t("Medical Report Interpretation"),
    [TopicType.DocumentTranslation]: t("Contract & Document Analysis"),
    // [TopicType.ProductInformation]: t("Product Information"),
    [TopicType.DrugInstructions]: t("Drug Instructions"),
    [TopicType.FoodDiscovery]: t("Food Label Interpretation"),
    [TopicType.MenuTranslation]: t("Menu Translation"),
    [TopicType.Chat]: t("JetAI"),
};