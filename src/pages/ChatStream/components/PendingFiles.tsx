import PendingFileItem from "@/components/common/PendingFileItem";
import { getFileIconAndLabel } from "@/utils/fileTypeUtils";
import React from "react";

interface PendingFilesProps {
    pendingFiles: { name: string; url: string }[];
    removePendingFile: (idx: number) => void;
}

const PendingFiles: React.FC<PendingFilesProps> = ({
    pendingFiles,
    removePendingFile,
}) => {
    if (pendingFiles.length === 0) return null;
    return (
        <div className="mb-2 flex flex-wrap gap-2 ">
            {pendingFiles.map((file, idx) => {
                const { icon, label } = getFileIconAndLabel(file.name);
                return (
                    <PendingFileItem
                        key={idx}
                        file={file}
                        icon={icon}
                        label={label}
                        onRemove={() => removePendingFile(idx)}
                    />
                );
            })}
        </div>
    );
};

export default PendingFiles;
