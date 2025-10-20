import i18n from "@/config/i18n";

export function t(key: string, options?: any): string {
  return String(i18n.t(key, options));
}
