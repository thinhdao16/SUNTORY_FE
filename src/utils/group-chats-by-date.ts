import dayjs from "dayjs";

function isToday(date: dayjs.Dayjs) {
    return date.isSame(dayjs(), "day");
}
function isYesterday(date: dayjs.Dayjs) {
    return date.isSame(dayjs().subtract(1, "day"), "day");
}

export function groupChatsByDate(chats: any[]) {
    if (!Array.isArray(chats) || chats.length === 0) {
        return { [t("No Data")]: [] };
    }

    const groups: Record<string, any[]> = {};

    chats.forEach((chat) => {
        const date = dayjs(chat.createDate);
        let label = "";

        if (isToday(date)) label = t("Today");
        else if (isYesterday(date)) label = t("Yesterday");
        else if (dayjs().diff(date, "day") < 7) {
            label = t("{{n}} days ago", { n: dayjs().diff(date, "day") });
        } else if (dayjs().diff(date, "week") === 1) {
            label = t("Last Week");
        } else {
            label = date.format("DD/MM/YYYY");
        }

        if (!groups[label]) groups[label] = [];
        groups[label].push(chat);
    });

    return groups;
}
