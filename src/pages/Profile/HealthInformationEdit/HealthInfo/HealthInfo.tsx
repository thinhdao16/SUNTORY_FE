import { t } from "@/lib/globalT";
import HealthInformationLayout from "@/components/layout/HealthInformationLayout";
import { useHealthFormSync } from "@/hooks/useHealthFormSync";
import { useHealthMasterData } from "@/hooks/common/useHealth";
import { useHealthMasterDataStore } from "@/store/zustand/health-master-data-store";
import { useMemo, useState } from "react";
import { useHistory } from "react-router";
import RadioButtonGroup from "@/components/button/RadioButton";
import MultiSelectButtonGroup from "@/components/button/MultiSelectButtonGroup";
import SendIcon from "@/icons/logo/send.svg?react";
import OtherInputField from "@/components/button/OtherInputField";
import ClickableCheckbox from "@/components/button/ClickableCheckbox";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";
// Extend the form type to include custom fields
type ExtendedBasicInfo = {
    fullName?: string;
    birthday?: string;
    gender?: string;
    height?: string;
    weight?: string;
    bloodType?: string;
    diet?: string;
    habits?: string[];
    healthConditions?: string[];
    otherHealthCondition?: string;
    hasSurgery?: boolean;
    surgeryDetail?: string;
    isPregnantOrBreastfeeding?: boolean;
    pregnantDetail?: string;
};

function mapHealthInfoToBasic(healthInfo: any): ExtendedBasicInfo {
    return {
        fullName: healthInfo?.name,
        birthday: healthInfo?.dateOfBirth ? healthInfo.dateOfBirth.split('T')[0] : undefined,
        gender: healthInfo?.gender === 1 ? 'male' : healthInfo?.gender === 2 ? 'female' : undefined,
        height: healthInfo?.height ? String(healthInfo.height) : undefined,
        weight: healthInfo?.weight ? String(healthInfo.weight) : undefined,
        diet: healthInfo?.lifestyles?.find((l: any) => l.lifestyleCategory?.name === 'Diet')?.name,
        habits: healthInfo?.lifestyles?.filter((l: any) => l.lifestyleCategory?.name === 'Habit').map((l: any) => l.name),
        healthConditions: healthInfo?.healthConditions?.map((h: any) => h.name),
    };
}

function HealthInfo() {
    const { data: healthInfo } = useAuthInfo();
    useHealthMasterData();
    const masterDataHealth = useHealthMasterDataStore((s) => s.masterData);
    // Sử dụng state local thay vì zustand store cho form
    const [basic, setBasic] = useState<ExtendedBasicInfo>(mapHealthInfoToBasic(healthInfo));
    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useHealthFormSync<ExtendedBasicInfo>(basic, setBasic);

    const onSubmit = (data: any) => {
        setBasic(data);
    };

    const diet = watch("diet");
    const habits = watch("habits") || [];
    const history = useHistory();

    const bloodTypes = useMemo(
        () => masterDataHealth?.bloodTypes || [],
        [masterDataHealth]
    );
    const diets = useMemo(() => {
        const group = masterDataHealth?.groupedLifestyles?.find(
            (g: any) => g.category?.name === "Diet"
        );
        return group?.lifestyles?.map((item: any) => item.name) || [];
    }, [masterDataHealth]);
    const habitsOptions = useMemo(() => {
        const group = masterDataHealth?.groupedLifestyles?.find(
            (g: any) => g.category?.name === "Habit"
        );
        return (
            group?.lifestyles?.map((item: any) => ({
                label: t(item.name),
                value: item.name,
            })) || []
        );
    }, [masterDataHealth, t]);

    function getHealthConditionsByCategory(
        masterDataHealth: any,
        t: (s: string) => string,
        categoryId: number,
        options?: { exclude?: boolean }
    ) {
        if (!masterDataHealth?.groupedHealthConditions) return [];
        const groups = options?.exclude
            ? masterDataHealth.groupedHealthConditions.filter((group: any) => group.category?.id !== categoryId)
            : masterDataHealth.groupedHealthConditions.filter((group: any) => group.category?.id === categoryId);

        return groups.flatMap((group: any) =>
            group.healthConditions?.map((item: any) => ({
                label: t(item.name),
                value: item.name,
                id: item.id,
                ...item,
            })) || []
        );
    }

    const nonPathologyHealthConditions = useMemo(
        () => getHealthConditionsByCategory(masterDataHealth, t, 1, { exclude: true }),
        [masterDataHealth, t]
    );

    const pathologyHealthConditions = useMemo(
        () => getHealthConditionsByCategory(masterDataHealth, t, 1),
        [masterDataHealth, t]
    );
    console.log(healthInfo)
    const selectedHealthConditions = watch("healthConditions" as const) || [];

    const otherCondition = watch("otherHealthCondition") || "";
    const hasSurgery = watch("hasSurgery") || false;
    const surgeryDetail = watch("surgeryDetail") || "";

    const isPregnantOrBreastfeeding = watch("isPregnantOrBreastfeeding") || false;

    return (
        <HealthInformationLayout
            title={t("Health Status")}
            subtitle={t("Select the diseases you have (if any)")}
            onBack={() => {
                history.replace("/profile/health");
            }}
            onSave={handleSubmit(onSubmit)}
        >
            <form className="flex flex-col gap-6 mt-4">
                <div>
                    <div className="mb-2 font-medium">{t("Blood Type")}</div>
                    <div className="grid gap-4 grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 xl:grid-cols-4">
                        {bloodTypes.map((type: any) => (
                            <button
                                type="button"
                                key={type.id}
                                className={`border rounded-xl text-lg aspect-7/6 py-2 ${watch("bloodType") === type.name
                                    ? "border-main text-main"
                                    : "border-netural-400 text-netural-400"
                                    }`}
                                onClick={() => setValue("bloodType", type.name)}
                            >
                                {type.name}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="mb-2 font-medium">{t("Diet")}</div>
                    <RadioButtonGroup
                        options={diets}
                        value={diet ?? ""}
                        onChange={(val) => setValue("diet", val)}
                    />
                </div>
                <div>
                    <div className="mb-2 font-medium">{t("Habits")}</div>
                    <MultiSelectButtonGroup
                        options={habitsOptions}
                        value={habits}
                        onChange={(val) => setValue("habits", val)}
                        className="grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2"
                    />
                </div>
                <div>
                    <div className="mb-2 font-medium">{t("Select the diseases you have (if any)")}</div>
                    <MultiSelectButtonGroup
                        options={pathologyHealthConditions}
                        value={selectedHealthConditions}
                        onChange={(val) => setValue("healthConditions", val)}
                        className="grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-3"
                    />
                </div>

                <OtherInputField
                    label={t("Other (if any)")}
                    placeholder={t("Nhập tên bệnh lý khác")}
                    value={otherCondition}
                    onChange={e => setValue("otherHealthCondition", e.target.value)}
                />
                <ClickableCheckbox
                    checked={hasSurgery}
                    onChange={val => setValue("hasSurgery", val)}
                    label={t("Có tiền sử phẫu thuật")}
                />

                {hasSurgery && (
                    <OtherInputField
                        label={t("Chi tiết phẫu thuật (nếu có)")}
                        placeholder={t("Nhập tên bệnh lý khác")}
                        value={surgeryDetail}
                        onChange={e => setValue("surgeryDetail", e.target.value)}
                    />
                )}
                <ClickableCheckbox
                    checked={isPregnantOrBreastfeeding}
                    onChange={val => setValue("isPregnantOrBreastfeeding", val)}
                    label={t("Đang mang thai/ cho con bú")}
                />
                {isPregnantOrBreastfeeding && (
                    <OtherInputField
                        label={t("Chi tiết mang thai (nếu có)")}
                        placeholder={t("Nhập triệu chứng khác")}
                        value={watch("pregnantDetail") || ""}
                        onChange={e => setValue("pregnantDetail", e.target.value)}
                    />
                )}
            </form>
        </HealthInformationLayout>
    );
}

export default HealthInfo;
