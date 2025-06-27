import React from "react";
import { IoChevronForward } from "react-icons/io5";
import { useHistory } from "react-router-dom";
import { t } from "@/lib/globalT";

const healthItems = [
    {
        label: t("Tình trạng sức khỏe"),
        path: "/health-information/health-info",
    },
    {
        label: t("Thông tin dị ứng"),
        path: "/health-information/allergy-info",
    },
    {
        label: t("Thuốc đang sử dụng"),
        path: "/health-information/medicine-info",
    },
    {
        label: t("Help & Feedback"),
        path: "/health-information/feedback",
    },
];

const HealthInformationEdit: React.FC = () => {
    const history = useHistory();

    return (
        <div className="">
            <ul className="space-y-2">
                {healthItems.map((item) => (
                    <li key={item.label}>
                        <button
                            type="button"
                            className="w-full flex items-center justify-between py-3 text-left text-[15px] text-gray-700 hover:bg-gray-50 rounded-lg transition"
                            onClick={() => history.push(item.path)}
                        >
                            <span>{item.label}</span>
                            <IoChevronForward className="text-lg text-gray-400" />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
export default HealthInformationEdit;
