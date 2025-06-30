import HealthInformationLayout from "@/components/layout/HealthInformationLayout";
import { t } from "@/lib/globalT";


function MedicineInfo() {
    return (
        <HealthInformationLayout
            title={t("Current Medications")}
            subtitle={t("List the medications you are taking regularly")}
            onBack={() => { /* handle back logic */ }}
            onSave={() => { /* handle save logic */ }}
        >
            <div>
                {/* Nội dung nhập thuốc đang sử dụng ở đây */}
            </div>
        </HealthInformationLayout>
    );
}

export default MedicineInfo;
