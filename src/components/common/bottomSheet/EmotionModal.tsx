import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonTextarea } from "@ionic/react";

type Emotion = { key: string; label: string; icon: string };

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

  t: (key: string) => string;
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
  t,
}) => {

  const EMOTIONS: Emotion[] = [
    { key: "happy", label: t("Happy"), icon: "😊" },
    { key: "sad", label: t("Sad"), icon: "😢" },
    { key: "angry", label: t("Angry"), icon: "😡" },
    { key: "love", label: t("Love"), icon: "😍" },
    { key: "afraid", label: t("Afraid"), icon: "😱" },
  ];

  const CONTEXT_PRESETS = [
    t("Greeting"), t("Shopping"), t("Dining"), t("Travel"), t("Work"),
    t("Help"), t("Study"), t("Healthcare"), t("Tech Support"), t("Small Talk"),
  ];

  function Chip({
    active, onClick, children,
  }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={[
          "px-3 py-1 rounded-full text-sm border transition whitespace-nowrap",
          active
            ? "bg-blue-100 border-blue-500 text-blue-700"
            : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50",
        ].join(" ")}
      >
        {children}
      </button>
    );
  }

  const [emotionText, setEmotionText] = useState<string>(emotionInput || "");
  const [contextText, setContextText] = useState<string>(context || "");
  const [contextPicked, setContextPicked] = useState<string[]>([]);

  const emotionByLabel = useMemo(() => {
    const m = new Map<string, Emotion>();
    EMOTIONS.forEach(e => {
      m.set(e.label.toLowerCase(), e);
      m.set(t(e.label).toLowerCase(), e);
    });
    return m;
  }, [t]);

  useEffect(() => {
    if (!isOpen) return;

    setEmotionText(emotionInput || "");
    setContextText(context || "");

    const tokens =
      (emotionInput || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

    const keys = tokens
      .map(tok => emotionByLabel.get(tok.toLowerCase())?.key)
      .filter(Boolean) as string[];

    setSelected(keys);
    const ctxTokens =
      (context || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
    setContextPicked(CONTEXT_PRESETS.filter(c =>
      ctxTokens.some(tk => tk.toLowerCase() === c.toLowerCase())
    ));
  }, [isOpen]);

  const toggleEmotion = (key: string) => {
    const isActive = selected.includes(key);
    const next = isActive ? selected.filter(k => k !== key) : [...selected, key];
    setSelected(next);

    const customParts = (emotionText || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .filter(lbl => !emotionByLabel.has(lbl.toLowerCase())); // loại preset cũ

    const presetLabels = next
      .map(k => EMOTIONS.find(e => e.key === k)!)
      .map(e => t(e.label));

    const newText = [...presetLabels, ...customParts].join(", ");
    setEmotionText(newText);
    setEmotionInput(newText);
  };

  const handleEmotionInputChange = (val: string) => {
    setEmotionText(val);
    setEmotionInput(val);

    const tokens =
      (val || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

    const keys = tokens
      .map(tok => emotionByLabel.get(tok.toLowerCase())?.key)
      .filter(Boolean) as string[];

    setSelected(keys);
  };

  const toggleContext = (label: string) => {
    const active = contextPicked.includes(label);
    const next = active
      ? contextPicked.filter(c => c !== label)
      : [...contextPicked, label];
    setContextPicked(next);

    const customParts = (contextText || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .filter(lbl => !CONTEXT_PRESETS.some(p => p.toLowerCase() === lbl.toLowerCase()));

    const newText = [...next.map(c => t(c)), ...customParts].join(", ");
    setContextText(newText);
    setContext(newText);
  };

  const clearEmotion = () => {
    console.log("Clearing emotions");
    setSelected([]);
    setEmotionText("");
    setEmotionInput("");
  };

  const clearContext = () => {
    setContextPicked([]);
    setContextText("");
    setContext("");
  };

  const handleConfirm = () => {
    const emTokens =
      (emotionText || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

    const emotions = emTokens.map(lbl => {
      const found = emotionByLabel.get(lbl.toLowerCase());
      if (found) return { label: found.label, icon: found.icon };
      return { label: lbl, icon: "💭" };
    });

    const ctxTokens =
      (contextText || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

    onConfirm({ emotions, context: ctxTokens });
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;
console.log(emotionInput)
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[151] flex items-end justify-center"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -10, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={handleOverlayClick}
      >
        <div
          className="w-full max-h-[95vh] rounded-t-3xl shadow-lg"
          style={{ transform: `translateY(${translateY}px)`, touchAction: "none" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => e.stopPropagation()}
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
              className="bg-white w-full h-full rounded-t-3xl px-6 shadow-lg overflow-y-auto"
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

                <div className="mb-2 font-semibold">{t("Context (Optional)")}</div>

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
                </div>
              </div>


            </div>
 <div className="mb-2 font-semibold">{t("Context (Optional)")}</div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {CONTEXT_PRESETS.map(c => (
                <Chip
                  key={c}
                  active={contextPicked.includes(c)}
                  onClick={() => toggleContext(c)}
                >
                  {c}
                </Chip>
              ))}
            </div>

            <div className="relative mt-3 mb-4">
              <IonTextarea
                autoGrow
                rows={1}
                placeholder={t("Add more context (comma separated)…")}
                value={contextText}
                onIonInput={(e) => { setContextText(e.detail.value ?? ""); setContext(e.detail.value ?? ""); }}
                className="w-full border border-neutral-200 rounded-xl focus:outline-0 placeholder:text-neutral-400"
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
                readonly
              />
              {contextText && (
                <button
                  className="absolute z-2 right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={clearContext}
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="mb-2 font-semibold">{t("Emotion")}</div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {EMOTIONS.map((e) => (
                <Chip
                  key={e.key}
                  active={selected.includes(e.key)}
                  onClick={() => toggleEmotion(e.key)}
                >
                  <span className="mr-1">{e.icon}</span>
                  {e.label}
                </Chip>
              ))}
            </div>

            <div className="relative mt-3 mb-6">
              <IonTextarea
                autoGrow
                rows={1}
                placeholder={t("Enter your Emotion...")}
                value={emotionText}
                onIonInput={(ev) => handleEmotionInputChange(ev.detail.value ?? "")}
                className="w-full border border-neutral-200 rounded-xl focus:outline-0 placeholder:text-neutral-400"
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
                readonly
              />
              {emotionText && (
                <button
                  className="absolute z-2 right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={clearEmotion}
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>

           
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmotionModal;
