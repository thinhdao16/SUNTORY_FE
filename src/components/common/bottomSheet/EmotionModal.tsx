import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonTextarea } from "@ionic/react";

interface EmotionModalProps {
  isOpen: boolean;
  translateY: number;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  onClose: () => void;
  onConfirm: (data: { emotions?: { icon: string; label: string }[]; context: string[] }) => void;
  setEmotionInput: (value: string) => void;
  emotionInput: string | undefined;
  context: string;
  setContext: (value: string) => void;
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  selected: string[];
  t: (key: string) => string; // Translation function
}



const EmotionModal: React.FC<EmotionModalProps> = ({
  isOpen,
  translateY,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  onClose,
  onConfirm,
  setEmotionInput,
  emotionInput,
  context,
  setContext,
  setSelected,
  selected,
  t, // Assuming you have a translation function passed as prop
}) => {
  // Sync selected buttons with input text on mount and input change
  const EMOTIONS = [
    { label: t("Happy"), icon: "😊" },
    { label: t("Sad"), icon: "😢" },
    { label: t("Angry"), icon: "😡" },
    { label: t("Love"), icon: "😍" },
    { label: t("Afraid"), icon: "😱" },
  ];
  useEffect(() => {
    if (emotionInput) {
      const inputEmotions = emotionInput
        .split(",")
        .map(e => e.trim())
        .filter(Boolean);

      // So sánh case-insensitive và giữ nguyên case từ EMOTIONS array
      const validEmotions = inputEmotions
        .map(emotion => {
          const found = EMOTIONS.find(e => e.label.toLowerCase() === emotion.toLowerCase());
          return found ? found.label : null; // Trả về label gốc từ EMOTIONS array
        })
        .filter(Boolean) as string[];

      setSelected(validEmotions);
    } else {
      setSelected([]);
    }
  }, [emotionInput, setSelected]);

  // src/components/common/bottomSheet/EmotionModal.tsx
  const handleToggle = (label: string) => {
    const newSelected = selected.includes(label)
      ? selected.filter((e) => e !== label)
      : [...selected, label];

    setSelected(newSelected);

    // Cập nhật emotion input nhưng giữ lại thứ tự và custom emotions
    // Lấy current input để preserve custom emotions và thứ tự
    const currentInput = emotionInput || "";
    const currentEmotions = currentInput
      .split(",")
      .map(e => e.trim())
      .filter(Boolean);

    let updatedEmotions: string[];

    if (selected.includes(label)) {
      // Removing emotion - chỉ xóa emotion đó khỏi input
      updatedEmotions = currentEmotions.filter(emotion =>
        emotion.toLowerCase() !== label.toLowerCase()
      );
    } else {
      // Adding emotion - thêm vào cuối nếu chưa có
      const emotionExists = currentEmotions.some(emotion =>
        emotion.toLowerCase() === label.toLowerCase()
      );

      if (!emotionExists) {
        updatedEmotions = [...currentEmotions, label];
      } else {
        updatedEmotions = currentEmotions;
      }
    }

    setEmotionInput(updatedEmotions.join(", "));
  };

  // src/components/common/bottomSheet/EmotionModal.tsx
  const handleEmotionInputChange = (value: string) => {
    setEmotionInput(value);

    // Parse input and update selected buttons
    const inputEmotions = value
      .split(",")
      .map(e => e.trim())
      .filter(Boolean);

    // Tách emotions thành 2 loại: có trong EMOTIONS và custom emotions
    const predefinedEmotions: string[] = [];
    const customEmotions: string[] = [];

    inputEmotions.forEach(emotion => {
      const found = EMOTIONS.find(e => e.label.toLowerCase() === emotion.toLowerCase());
      if (found) {
        predefinedEmotions.push(found.label); // Giữ nguyên case từ EMOTIONS
      } else {
        customEmotions.push(emotion);
      }
    });

    const allEmotions = [...predefinedEmotions, ...customEmotions];
    setSelected(allEmotions);
  };
  const handleCancel = () => {
    onClose();
  };

  const clearEmotionInput = () => {
    console.log("object");
    setEmotionInput("");
    setSelected([]);
  };
  const clearContextInput = () => {
    setContext("");
  };

  const handleConfirm = () => {
    onConfirm({
      emotions: (emotionInput ?? "")
        .split(",")
        .map((e) => {
          const label = e.trim();
          if (!label) return undefined;

          const found = EMOTIONS.find((emo) => emo.label.toLowerCase() === label.toLowerCase());

          if (found) {
            return { label: found.label, icon: found.icon };
          } else {
            return { label: label, icon: "💭" };
          }
        })
        .filter((e): e is { label: string; icon: string } => e !== undefined),
      context: context.split(",").map((c) => c.trim()).filter(Boolean),
    });
    onClose();
  };
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-151 h-full flex justify-center items-end"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleOverlayClick}
        >
          <div
            className="bg-success-500 w-full max-h-[95vh] rounded-t-4xl shadow-lg  transition-transform duration-300 ease-out"
            style={{
              transform: `translateY(${translateY}px)`,
              touchAction: "none",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="bg-white w-full h-full rounded-t-3xl px-6 shadow-lg
                 overflow-y-auto"
              style={{ maxHeight: 'calc(80vh - 2rem)', minHeight: '95vh' }}
            >
              <div className="flex gap-4 justify-between mb-4 sticky top-0 bg-white z-99 pt-6">
                <button
                  className="border border-main text-main rounded-xl px-4 py-1.5"
                  onClick={handleCancel}
                  type="button"
                >
                  {t("Cancel")}
                </button>
                <button
                  className="bg-main text-white rounded-xl px-4 py-1.5"
                  onClick={handleConfirm}
                  type="button"
                >
                  {t("Save Setting")}
                </button>
              </div>
              <div className="pb-6">
                <div className="mb-4">
                  <div className="font-semibold mb-2">{t("Emotion")}</div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {EMOTIONS.map((e) => (
                      <button
                        key={e.label}
                        type="button"
                        className={`flex items-center gap-1 px-3 py-1 rounded-full border text-sm transition-colors whitespace-nowrap flex-shrink-0 ${selected.includes(e.label)
                          ? "bg-blue-100 border-blue-500 text-blue-700"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        onClick={() => handleToggle(e.label)}
                      >
                        <span>{e.icon}</span>
                        <span>{t(e.label)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative mb-4">
                  <IonTextarea
                    autoGrow
                    rows={1}
                    placeholder={t("Happy, funny")}
                    value={emotionInput || ""}
                    onIonInput={e => handleEmotionInputChange(e.detail.value ?? "")}
                    className="w-full border border-neutral-200 rounded-xl focus:outline-0 placeholder:text-neutral-200"
                    style={{
                      boxShadow: "none",
                      "--highlight-color-focused": "none",
                      height: "auto",
                      minHeight: "44px",
                      "--padding-top": "14px",
                      "--padding-bottom": "14px",
                      "--padding-start": "16px",
                      "--padding-end": "16px",
                    } as React.CSSProperties}
                  />
                  {(emotionInput && emotionInput.length > 0) && (
                    <button
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-99"
                      onClick={() => clearEmotionInput()}
                      type="button"
                    >
                      x
                    </button>
                  )}

                </div>

                {/* <div className="mb-2 font-semibold">{t("Context (Optional)")}</div>

                <div className="relative mb-4">
                  <IonTextarea
                    autoGrow
                    rows={1}
                    placeholder={t("Office")}
                    value={context || ""}
                    onIonInput={(e) => setContext(e.detail.value ?? "")}
                    className="w-full border border-neutral-200 rounded-xl focus:outline-0 placeholder:text-neutral-200"
                    style={{
                      boxShadow: "none",
                      "--highlight-color-focused": "none",
                      height: "auto",
                      minHeight: "44px",
                      "--padding-top": "14px",
                      "--padding-bottom": "14px",
                      "--padding-start": "16px",
                      "--padding-end": "16px",
                    } as React.CSSProperties}
                  />

                  {(context && context.length > 0) && (
                    <button
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-99"
                      onClick={clearContextInput}
                      type="button"
                    >
                      ✕
                    </button>
                  )}
                </div> */}
              </div>


            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmotionModal;
