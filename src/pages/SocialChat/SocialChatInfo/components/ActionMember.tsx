import React from "react";
import BottomSheet from "../../../../components/common/bottomSheet/BottomSheet";

interface ActionMemberProps {
    isOpen: boolean;
    translateY: number;
    closeModal: () => void;
    handleTouchStart: (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent) => void;
    handleTouchEnd: () => void;
    selectedUser?: any;
    onViewProfile?: (userId: number) => void;
    onSendMessage: (user: any) => void;
    onAppointAdmin?: (userId: number) => void;
    onRemoveFromGroup?: (userId: number) => void;
    isAdmin: boolean
}

const ActionMember: React.FC<ActionMemberProps> = ({
    isOpen,
    translateY,
    closeModal,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    selectedUser,
    onViewProfile,
    onSendMessage,
    onAppointAdmin,
    onRemoveFromGroup,
    isAdmin
}) => {
    const userId = selectedUser?.userId;

    return (
        <BottomSheet
            isOpen={isOpen}
            translateY={translateY}
            closeModal={closeModal}
            handleTouchStart={handleTouchStart}
            handleTouchMove={handleTouchMove}
            handleTouchEnd={handleTouchEnd}
            showHandleBar={true}
            showHeader={false}
            roundedTop={"!bg-netural-50 rounded-t-3xl"}
        >
            <div className="p-4 pb-6">
                <div className="flex flex-col px-4 bg-white w-full rounded-2xl overflow-hidden">
                    <button
                        className="py-4 text-start  border-b border-gray-100"
                        onClick={() => onViewProfile?.(userId)}
                    >
                        View profile
                    </button>
                    <button
                        className="py-4 text-start  border-b border-gray-100"
                        onClick={() => onSendMessage?.(selectedUser?.user)}
                    >
                        Send message
                    </button>
                    {isAdmin && (
                        <>
                            <button
                                className="py-4 text-start  border-b border-gray-100"
                                onClick={() => onAppointAdmin?.(selectedUser)}
                            >
                                Appoint as admin
                            </button>
                            <button
                                className="py-4 text-start  text-red-500"
                                onClick={() => onRemoveFromGroup?.(userId)}
                            >
                                Remove from this group
                            </button>
                        </>
                    )}
                </div>
            </div>
        </BottomSheet>
    );
};

export default ActionMember;
