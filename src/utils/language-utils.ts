export const getAdjustedLang = (lang?: string): string => {
  switch (lang) {
    case "Chinese":
      return "zh-CN";
    case "tw":
      return "zh-TW";
    case "Japanese":
      return "ja-JP";
    case "Vietnamese":
      return "vi-VN";
    case "French":
      return "fr-FR";
    case "German":
      return "de-DE";
    case "Korean":
      return "ko-KR";
    default:
      return lang || "en-US";
  }
};
