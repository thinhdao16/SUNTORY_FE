import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import calendar from "dayjs/plugin/calendar";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { TFunction } from "i18next";
import i18n from "@/config/i18n";

import "dayjs/locale/vi";
import "dayjs/locale/en";
import "dayjs/locale/zh";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(calendar);

dayjs.locale(i18n.language.split("-")[0]);

export const formatTimeFromNow = (isoTime: string, t: TFunction) => {
    const localTz = dayjs.tz.guess();
    const target = dayjs.utc(isoTime).tz(localTz);
    const now = dayjs().tz(localTz);

    const diffInMinutes = now.diff(target, "minute");
    const diffInDays = now.diff(target, "day");

    if (diffInMinutes < 1) return t("time.now");
    if (diffInMinutes < 60) return t("time.minutesAgo", { count: diffInMinutes });
    if (diffInMinutes < 1440) return t("time.hoursAgo", { count: Math.floor(diffInMinutes / 60) });

    if (diffInDays === 1) return t("time.yesterday");
    if (diffInDays < 7) return t("time.daysAgo", { count: diffInDays });

    return target.format("DD/MM/YYYY");
};
export function formatDateUtil(
    dateStr: string,
    t: (key: string) => string,
    locale: string = ""
): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    function isSameDay(d1: Date, d2: Date) {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    }

    if (isSameDay(date, today)) {
        return t("Today");
    } else if (isSameDay(date, yesterday)) {
        return t("Yesterday");
    } else {
        return date.toLocaleDateString(locale, {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }
}