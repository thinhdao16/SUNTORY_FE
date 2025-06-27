import { t } from "@/lib/globalT";
import HealthInformationLayout from "@/components/layout/HealthInformationLayout";
import HealthTextInput from "@/components/input/HealthTextInput";
import { useHealthFormSync } from "@/hooks/useHealthFormSync";
import { useHeathInformationStore } from "@/store/zustand/health-information-store";
import MultiSelectButtonGroup from "@/components/button/MultiSelectButtonGroup";
import RadioButtonGroup from "@/components/button/RadioButton";
import SelectMenu from "@/components/select/SelectMenu";
import { IoCalendarOutline } from "react-icons/io5";


const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const DIETS = [t("Omnivore"), t("Vegetarian"), "Low Carb", "Keto"];
const HABITS = [
    { label: t("Smoking"), value: "smoke" },
    { label: t("Drinking alcohol"), value: "alcohol" },
    { label: t("Sleep at least 8 hours/day"), value: "sleep_good" },
    { label: t("Sleep less than 8 hours/day"), value: "sleep_bad" },
];
function HealthInfo() {
    const basic = useHeathInformationStore((s) => s.basic);
    const setBasic = useHeathInformationStore((s) => s.setBasic);

    // Sử dụng custom hook
    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useHealthFormSync(basic, setBasic);

    const onSubmit = (data: any) => {
        setBasic(data);
    };

    const birthdayInputRef = useRef<HTMLInputElement>(null);
    const diet = watch("diet");
    const habits = watch("habits") || [];
    return (
        <HealthInformationLayout
            title={t("Health Status")}
            subtitle={t("Select the diseases you have (if any)")}
            onBack={() => { /* handle back logic */ }}
            onSave={() => { onSubmit }}
        >
            <form className="flex flex-col gap-6 mt-4">

                <div>
                    <div className="mb-2 font-medium">{t("Blood Type")}</div>
                    <div className="grid grid-cols-4 gap-4 lg:grid-cols-8">
                        {BLOOD_TYPES.map((type) => (
                            <button
                                type="button"
                                key={type}
                                className={`border  rounded-xl text-lg aspect-7/6 py-2 ${watch("bloodType") === type ? "border-main text-main" : "border-netural-400 text-netural-400"}`}
                                onClick={() => setValue("bloodType", type)}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="mb-2 font-medium">{t("Diet")}</div>
                    <RadioButtonGroup
                        options={DIETS}
                        value={diet}
                        onChange={(val) => setValue("diet", val)}
                    />
                </div>
                {/* Thói quen */}
                <div>
                    <div className="mb-2 font-medium">{t("Habits")}</div>
                    <MultiSelectButtonGroup
                        options={HABITS}
                        value={habits}
                        onChange={(val) => setValue("habits", val)}
                    />
                </div>
            </form>
        </HealthInformationLayout>
    );
}

export default HealthInfo;
