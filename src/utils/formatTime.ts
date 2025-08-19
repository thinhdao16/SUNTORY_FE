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
