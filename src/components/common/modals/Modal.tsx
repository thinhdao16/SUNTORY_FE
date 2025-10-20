import React from "react";
import { IonModal, IonSpinner } from "@ionic/react";
import "./Modal.css";

type MyModalProps = {
    isOpen: boolean;
    closeModal: () => void;
    loading?: boolean;
    loadingMessage?: string;
    children?: React.ReactNode;
    className?: string;
};

const MyModal: React.FC<MyModalProps> = ({ isOpen, closeModal, loading = false, loadingMessage = "Loading…", children, className = "" }) => {
    return (
        <IonModal
            isOpen={isOpen}
            onDidDismiss={closeModal}
            backdropDismiss
            canDismiss
            className={`auto-height ${className}`}
        >
            <div className="--padding-0 inner-content !h-auto px-10 py-12 relative">
                {children}

                {loading && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-black/40
                      flex items-center justify-center rounded-2xl z-10">
                        <div className="flex items-center gap-3 bg-white dark:bg-neutral-800
                        rounded-xl px-4 py-3 shadow">
                            <IonSpinner name="crescent" />
                            <span className="text-sm font-medium">{loadingMessage}</span>
                        </div>
                    </div>
                )}
            </div>
        </IonModal>
    );
};

export default MyModal;
