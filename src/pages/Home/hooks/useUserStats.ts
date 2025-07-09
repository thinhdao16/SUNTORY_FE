import { useTranslation } from 'react-i18next';

export const useUserStats = (userInfo: any) => {
    const { t } = useTranslation();

    const getAge = (dateString: string) => {
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return Math.max(1, age);
    };

    const user = userInfo;
    const age = user?.dateOfBirth ? getAge(user.dateOfBirth) : "-";
    const height = user?.height ? `${user.height} ${t("cm")}` : "-";
    const weight = user?.weight ? `${user.weight} ${t("kg")}` : "-";
    const bmi = user?.height && user?.weight
        ? (user.weight / ((user.height / 100) ** 2)).toFixed(1)
        : "-";

    return { age, height, weight, bmi };
};
