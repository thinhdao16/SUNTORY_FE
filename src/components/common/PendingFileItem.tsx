import React from "react";

import RemoveIcon from "@/icons/logo/chat/x.svg?react";

interface PendingFileItemProps {
    file: { name: string; url: string };
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    label: string;
    onRemove?: () => void;
    showRemove?: boolean;
}

const PendingFileItem: React.FC<PendingFileItemProps> = ({
    file,
    icon: Icon,
    label,
    onRemove,
    showRemove = true,
}) => (
    <div className="w-60 relative flex items-center rounded-2xl p-2 border border-netural-100">
        {showRemove && (
            <button
                className="absolute top-1 right-1 bg-black rounded-full w-[14px] h-[14px] justify-center items-center flex"
                onClick={() => onRemove && onRemove()}
            >
                <RemoveIcon className="w-2.5 h-2.5 text-white" />
            </button>
        )}
        <Icon className="w-10 h-10 mr-2" aria-label={label} />
        <div className="flex flex-col min-w-0 text-left">
            <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium overflow-hidden text-ellipsis whitespace-nowrap inline-block align-middle"
                title={file.name}
            >
                {file.name}
            </a>
            <span className="text-sm text-gray-500">{label}</span>
        </div>
    </div>
);

export default PendingFileItem;