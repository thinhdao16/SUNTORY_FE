import React from "react";
import { IoVolumeMediumOutline } from "react-icons/io5";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { getAdjustedLang } from "@/utils/language-utils";

interface TextToSpeechButtonProps {
  text: string;
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

const TextToSpeechButton: React.FC<TextToSpeechButtonProps> = ({
  text,
  lang,
  rate = 1.0,
  pitch = 1.0,
  volume = 1.0,
}) => {
  const speak = async () => {
    try {
      if (text) {
        const adjustedLang = getAdjustedLang(lang);
        await TextToSpeech.speak({
          text,
          lang: adjustedLang,
          rate,
          pitch,
          volume,
          category: "ambient",
        });
      } else {
        console.warn(t("No text to read.")); // Sử dụng i18n ở đây
      }
    } catch (error) {
      console.error(t("TextToSpeech error:"), error); // Sử dụng i18n ở đây
    }
  };

  return (
    <IoVolumeMediumOutline
      className="text-3xl darkk:text-white cursor-pointer"
      onClick={speak}
    />
  );
};

export default TextToSpeechButton;
