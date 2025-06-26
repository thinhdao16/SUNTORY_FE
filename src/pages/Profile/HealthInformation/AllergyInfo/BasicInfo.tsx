import HealthInformationStepLayout from "@/components/layout/HealthInformationStepLayout";
import { useStepGuard } from "@/hooks/useStepGuard";
import { useStepProgress } from "@/hooks/useStepProgress";
import { useHeathInformationStore } from "@/store/zustand/health-information-store";
import HealthTextInput from "@/components/input/HealthTextInput";
import SelectMenu from "@/components/select/SelectMenu";
import { IoCalendarOutline } from "react-icons/io5";
import { useHealthFormSync } from "@/hooks/useHealthFormSync";
import RadioButtonGroup from "@/components/button/RadioButton";
import MultiSelectButtonGroup from "@/components/button/MultiSelectButtonGroup";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const DIETS = [t("Omnivore"), t("Vegetarian"), "Low Carb", "Keto"];
const HABITS = [
    { label: t("Smoking"), value: "smoke" },
    { label: t("Drinking alcohol"), value: "alcohol" },
    { label: t("Sleep at least 8 hours/day"), value: "sleep_good" },
    { label: t("Sleep less than 8 hours/day"), value: "sleep_bad" },
];

function BasicInfo() {
    const {
        steps,
        handleNext,
        handleStepClick,
        handleBack,
        currentStep,
    } = useStepProgress();
    useStepGuard(0);
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
    } = useHealthFormSync(basic, setBasic, [currentStep]);

    const onSubmit = (data: any) => {
        setBasic(data);
        handleNext();
    };

    const birthdayInputRef = useRef<HTMLInputElement>(null);
    const diet = watch("diet");
    const habits = watch("habits") || [];

    return (
        <HealthInformationStepLayout
            steps={steps}
            current={currentStep}
            onStepClick={handleStepClick}
            onBack={handleBack}
            onNext={handleSubmit(onSubmit)}
            showSkip={true}
            showBack={true}
            title={t("Basic Information")}
            subtitle={t("Help us understand you better")}
        >
            <form className="flex flex-col gap-6 mt-4">
                <HealthTextInput
                    label={t("Full Name")}
                    name="fullName"
                    register={register}
                    required={false}
                    placeholder={t("e.g. John Doe")}
                    error={errors.fullName}
                />
                <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                        <HealthTextInput
                            label={t("Birthday")}
                            name="birthday"
                            register={register}
                            required={false}
                            placeholder={t("mm/dd/yyyy")}
                            error={errors.birthday}
                            type="date"
                            inputRef={birthdayInputRef}
                            logo={
                                <span
                                    onClick={() => birthdayInputRef.current?.showPicker
                                        ? birthdayInputRef.current.showPicker()
                                        : birthdayInputRef.current?.focus()}
                                    className="cursor-pointer"
                                >
                                    <IoCalendarOutline className="text-base" />
                                </span>
                            }
                            className="[&::-webkit-calendar-picker-indicator]:opacity-0"
                        />
                    </div>
                    <div className="col-span-1">
                        <SelectMenu
                            name="gender"
                            control={control}
                            label={t("Gender")}
                            options={[
                                { code: "male", label: t("Male") },
                                { code: "female", label: t("Female") },
                                { code: "other", label: t("Other") },
                            ]}
                            required={false}
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <HealthTextInput
                        label={t("Height (cm)")}
                        name="height"
                        register={register}
                        required={false}
                        type="number"
                        placeholder="170"
                    />
                    <HealthTextInput
                        label={t("Weight (kg)")}
                        name="weight"
                        register={register}
                        required={false}
                        type="number"
                        placeholder="60"
                    />
                </div>
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
        </HealthInformationStepLayout>
    );
}

export default BasicInfo;
