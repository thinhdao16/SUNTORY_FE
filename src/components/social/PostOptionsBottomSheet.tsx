import React from 'react';
import BottomSheet from '@/components/common/BottomSheet';

interface ActionItem {
    key: string;
    label: string;
    icon: React.ReactNode;
    tone: 'default' | 'danger';
    onClick: () => void;
}

interface ActionGroup {
    items: ActionItem[];
}

interface PostOptionsBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    actionItems?: ActionItem[];
    actionGroups?: ActionGroup[];
    variant?: 'simple' | 'detailed';
}

const PostOptionsBottomSheet: React.FC<PostOptionsBottomSheetProps> = ({
    isOpen,
    onClose,
    actionItems,
    actionGroups,
    variant = 'detailed'
}) => {
    // Convert actionItems to groups format if provided
    const groups = actionGroups || (actionItems ? [{ items: actionItems }] : []);
    if (variant === 'detailed') {
        return (
            <BottomSheet
                isOpen={isOpen}
                onClose={onClose}
                title={null}
                showCloseButton={false}
                className="post-action-bottom-sheet"
                classNameContainer="!bg-netural-50"
            >
                <div className="flex flex-col bg-white rounded-2xl overflow-hidden">
                    {groups.map((group, groupIndex) => (
                        <div key={groupIndex}>
                            {group.items.map((item, index) => (
                                <button
                                    key={item.key}
                                    onClick={item.onClick}
                                    className={`w-full flex items-center justify-between px-5 py-4 text-sm font-medium transition-colors ${
                                        index !== group.items.length - 1 ? 'border-b border-gray-100' : ''
                                    } hover:bg-gray-50`}
                                >
                                    <span className={`text-left ${item.tone === 'danger' ? 'text-error-400' : 'text-netural-900'}`}>
                                        {item.label}
                                    </span>
                                    <span className={item.tone === 'danger' ? 'text-error-400' : 'text-netural-200'}>
                                        {item.icon}
                                    </span>
                                </button>
                            ))}
                            {groupIndex < groups.length - 1 && (
                                <div className="h-2 bg-gray-50 border-b border-gray-100"></div>
                            )}
                        </div>
                    ))}
                </div>
            </BottomSheet>
        );
    }

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose}>
            <div className="p-4">
                <div className="flex flex-col space-y-2">
                    {groups.map((group, groupIndex) => (
                        <div key={groupIndex}>
                            {group.items.map((item) => (
                                <button
                                    key={item.key}
                                    onClick={() => {
                                        item.onClick();
                                        onClose();
                                    }}
                                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${item.tone === 'danger'
                                            ? 'text-red-600 hover:bg-red-50'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            ))}
                            {groupIndex < groups.length - 1 && (
                                <div className="h-px bg-gray-200 my-2"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </BottomSheet>
    );
};

export default PostOptionsBottomSheet;
