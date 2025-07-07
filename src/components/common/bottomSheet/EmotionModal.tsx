import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
interface EmotionModalProps {
  isOpen: boolean;
  translateY: number;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  onClose: () => void;
  onConfirm: (data: { emotions?: { icon: string; label: string }[]; context: string[] }) => void;
}
const EMOTIONS = [
  { label: "Happy", icon: "😊" },
  { label: "Sad", icon: "😢" },
  { label: "Angry", icon: "😡" },
  { label: "Love", icon: "😍" },
  { label: "Afraid", icon: "😱" },
];
const EmotionModal: React.FC<EmotionModalProps> = ({
  isOpen,
  translateY,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  onClose,
  onConfirm
}) => {

  const [selected, setSelected] = useState<string[]>([]);
  const [emotionInput, setEmotionInput] = useState(undefined as string | undefined);
  const [context, setContext] = useState("Office");

  const handleToggle = (label: string) => {
    setSelected((prev) =>
      prev.includes(label)
        ? prev.filter((e) => e !== label)
        : [...prev, label]
    );
  };

  const handleClear = () => {
    setSelected([]);
    setEmotionInput(undefined);
    setContext("");
  };
  console.log(context)
  const handleConfirm = () => {
    onConfirm({
      emotions: (emotionInput ?? "")
        .split(",")
        .map((e) => {
          const label = e.trim();
          const found = EMOTIONS.find((emo) => emo.label.toLowerCase() === label.toLowerCase());
          return found ? { label: found.label, icon: found.icon } : undefined;
        })
        .filter((e): e is { label: string; icon: string } => e !== undefined),
      context: context.split(",").map((c) => c.trim()).filter(Boolean),
    });
    onClose();
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
        >
          <div
            className="bg-success-500 darkk:bg-dark-extra w-full h-[95%] rounded-t-4xl shadow-lg transition-transform duration-300 ease-out"
            style={{
              transform: `translateY(${translateY}px)`,
              touchAction: "none",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="bg-white w-full h-full rounded-t-3xl p-6 shadow-lg">
              <div className="mb-4">
                <div className="font-semibold mb-2">Emotion</div>
                <div className="flex gap-2 flex-wrap">
                  {EMOTIONS.map((e) => (
                    <button
                      key={e.label}
                      type="button"
                      className={`flex items-center gap-1 px-3 py-1 rounded-full border text-sm ${selected.includes(e.label)
                        ? "bg-blue-100 border-blue-500 text-blue-700"
                        : "bg-white border-gray-300 text-gray-500"
                        }`}
                      onClick={() => {
                        handleToggle(e.label);
                        setEmotionInput(
                          selected.includes(e.label)
                            ? (emotionInput ?? "")
                              .split(",")
                              .map((em) => em.trim())
                              .filter((em) => em !== e.label)
                              .join(", ")
                            : [...(emotionInput ?? "").split(",").map((em) => em.trim()), e.label]
                              .filter(Boolean)
                              .join(", ")
                        );
                      }}
                    >
                      <span>{e.icon}</span>
                      <span>{e.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <input
                className="w-full border rounded-lg px-3 py-2 mb-4"
                placeholder="Happy, funny"
                value={emotionInput}
                onChange={(e) => setEmotionInput(e.target.value)}
              />
              <div className="mb-2 font-medium">Context (Optional)</div>
              <input
                className="w-full border rounded-lg px-3 py-2 mb-4"
                placeholder="Office"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
              <div className="flex gap-4 justify-between">
                <button
                  className="border border-blue-500 text-blue-500 rounded-lg px-6 py-2"
                  onClick={handleClear}
                  type="button"
                >
                  Clear
                </button>
                <button
                  className="bg-blue-600 text-white rounded-lg px-6 py-2"
                  onClick={handleConfirm}
                  type="button"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmotionModal;
