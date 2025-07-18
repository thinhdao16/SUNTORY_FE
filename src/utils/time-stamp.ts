/**
 * Converts a given Date (or string) to a precise timestamp in microseconds.
 * Ensures consistent sorting and uniqueness for chat messages.
 * @param dateInput - Date object or ISO string (e.g. "2025-06-24T13:37:13.061193")
 * @returns microsecond timestamp as string
 */
export function generatePreciseTimestampFromDate(dateInput: Date | string): number {
    if (!dateInput) return 0;
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    const milliseconds = date.getTime();
    const fractionalMicro = extractMicroFraction(dateInput);
    // Đổi BigInt sang number
    const fullMicro = milliseconds * 1000 + fractionalMicro;
    return fullMicro;
}
/**
 * Extracts the microsecond part (after milliseconds) from an ISO string
 * Example: "2025-06-24T13:37:13.061193" → returns 193
 */
function extractMicroFraction(dateInput: Date | string): number {
    const str = typeof dateInput === "string" ? dateInput : dateInput.toISOString();
    const match = str.match(/\.(\d{6})/); // look for .123456
    if (match && match[1]) {
        const micro = match[1]; // "061193"
        return parseInt(micro.slice(3), 10); // "193"
    }
    return 0;
}
