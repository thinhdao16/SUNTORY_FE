import React from "react";
import { IonToast } from "@ionic/react";
import { useToastStore } from "@/store/zustand/toast-store";
import "./index.css";

const typeColor: Record<string, string> = {
  success: "#22c55e",
  error: "#ef4444",
  warning: "#f59e42",
  info: "#2563eb",
};

const Toast: React.FC = () => {
  const { message, duration, isOpen, hideToast, type } = useToastStore();
  return (
    <IonToast
      isOpen={isOpen}
      onDidDismiss={hideToast}
      message={message || ""}
      duration={duration}
      position="bottom"
      cssClass={`toast-${type}`}
    />

  );
};

export default Toast;
