import React, { Fragment, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';

interface EditGroupNameModalProps {
    isOpen: boolean;
    initialName: string;
    onClose: () => void;
    onSave: (newName: string) => void;
}

const EditGroupNameModal: React.FC<EditGroupNameModalProps> = ({
    isOpen,
    initialName,
    onClose,
    onSave
}) => {
    const [groupName, setGroupName] = useState(initialName);

    const handleSave = () => {
        if (groupName.trim()) {
            onSave(groupName);
            onClose();
        }
    };
    useEffect(() => {
        setGroupName(initialName);
    }, [initialName, isOpen]);
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-4 shadow-xl transition-all">
                                <DialogTitle as="h3" className="text-base font-semibold text-netural-500 mb-4">
                                    {t("Edit group name")}
                                </DialogTitle>

                                <div className="mb-6">
                                    <input
                                        type="text"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        placeholder="Nhập tên nhóm"
                                        className="w-full border-0 border-b border-gray-300 py-2 focus:border-netural-500 focus:ring-0 outline-none"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex justify-end gap-4">
                                    <button
                                        type="button"
                                        className="text-gray-600 font-medium"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="text-main font-semibold disabled:text-blue-300"
                                        onClick={handleSave}
                                        disabled={!groupName.trim()}
                                    >
                                        Save
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

export default EditGroupNameModal;