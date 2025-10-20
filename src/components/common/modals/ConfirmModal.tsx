import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import React, { Fragment } from "react";

interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onClose: () => void;
    // Optional class overrides for button colors/styles
    confirmButtonClassName?: string;
    cancelButtonClassName?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title = t("Are you sure?"),
    message = t("You will no longer see their updates or share yours with them"),
    confirmText = t("Yes, unfriend"),
    cancelText = t("Cancel"),
    onConfirm,
    onClose,
    confirmButtonClassName = "",
    cancelButtonClassName = "",
}) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[999]" onClose={onClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/20" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center px-4 text-center">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 translate-y-4 scale-95"
                            enterTo="opacity-100 translate-y-0 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0 scale-100"
                            leaveTo="opacity-0 translate-y-4 scale-95"
                        >
                            <DialogPanel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white text-center shadow-xl transition-all pt-4">
                                <DialogTitle
                                    as="h3"
                                    className="text-base font-semibold text-gray-900 px-4"
                                >
                                    {title}
                                </DialogTitle>
                                <p className="mt-2 text-sm text-gray-600 px-4">{message}</p>
                                <div className="mt-6 flex justify-center gap-3 bg-netural-50 p-4">
                                    <button
                                        onClick={onClose}
                                        className={`${cancelButtonClassName} rounded-full bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200`}
                                    >
                                        {cancelText}
                                    </button>
                                    <button
                                        onClick={() => {
                                            onConfirm();
                                            onClose();
                                        }}
                                        className={`${confirmButtonClassName} rounded-full bg-red-500 px-6 py-2 text-sm font-medium text-white hover:bg-red-600`}
                                    >
                                        {confirmText}
                                    </button>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>

            </Dialog>
        </Transition>
    );
};

export default ConfirmModal;
