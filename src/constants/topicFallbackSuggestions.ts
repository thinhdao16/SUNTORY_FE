import { t } from "@/lib/globalT";

export const topicFallbackSuggestions: Record<number, string[]> = {
    10: [
        t("Bạn có thể cung cấp đầy đủ các chỉ số (nhịp tim, huyết áp, BMI, đường huyết, lipid, chức năng gan thận...) và ngày khám gần nhất không?"),
        t("Bạn muốn tôi tóm tắt các kết quả xét nghiệm chính và đánh giá rủi ro sức khỏe dựa trên dữ liệu hiện có không?"),
        t("Bạn có muốn nhận gợi ý chế độ ăn và vận động phù hợp theo mục tiêu (giảm cân/kiểm soát đường huyết/giảm mỡ máu) không?"),
    ],
    20: [
        t("Hãy tải lên hợp đồng/tài liệu cần phân tích (PDF/Ảnh) để tôi trích xuất nội dung và tóm tắt giúp bạn."),
        t("Bạn có muốn tôi chỉ ra các điều khoản quan trọng hoặc rủi ro pháp lý trong tài liệu này không?"),
        t("Bạn muốn dịch tài liệu sang ngôn ngữ nào và có cần giữ nguyên bố cục/định dạng không?"),
    ],
    40: [
        t("Bạn có thể gửi ảnh nhãn thực phẩm (mặt trước và bảng thành phần dinh dưỡng) để tôi phân tích không?"),
        t("Bạn muốn so sánh sản phẩm này với sản phẩm khác về calo, đường, muối, chất béo không?"),
        t("Bạn đang theo chế độ ăn nào (ít đường/ít muối/ăn chay/giảm cân) để tôi đưa ra khuyến nghị phù hợp?"),
    ],
};
