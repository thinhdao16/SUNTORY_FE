import React from "react";
import { IoClose, IoPlay, IoDocument } from "react-icons/io5";

export interface PendingFile {
    id: string;
    name: string;
    type: 'image' | 'video' | 'file';
    url?: string;
    file?: File;
    progress?: number;
    isUploading?: boolean;
    error?: string;
    serverUrl?: string; // URL từ server sau khi upload xong
    serverName?: string; // Name từ server (path/filename) thay thế cho name local
}

interface PendingFilesListProps {
    pendingFiles: PendingFile[];
    onRemoveFile: (id: string) => void;
    onRetryUpload?: (id: string) => void;
}

const PendingFilesList: React.FC<PendingFilesListProps> = ({
    pendingFiles,
    onRemoveFile,
    onRetryUpload
}) => {
    if (pendingFiles.length === 0) return null;

    return (
        <div className="px-4 py-3 bg-white border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
                {pendingFiles.map((file) => (
                    <div key={file.id} className="relative group">
                        {/* File Preview */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 relative">
                            {file.type === 'image' && file.url ? (
                                <img 
                                    src={file.url} 
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : file.type === 'video' && file.url ? (
                                <div className="relative w-full h-full">
                                    <video 
                                        src={file.url}
                                        className="w-full h-full object-cover"
                                        muted
                                    />
                                    {/* Play icon overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                        <IoPlay className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <IoDocument className="w-6 h-6 text-gray-400" />
                                </div>
                            )}
                            
                            {/* Upload progress overlay */}
                            {file.isUploading && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                    <div className="text-white text-xs font-medium">
                                        {file.progress ? `${file.progress}%` : '...'}
                                    </div>
                                </div>
                            )}
                            
                            {/* Error overlay */}
                            {file.error && (
                                <div className="absolute inset-0 bg-red-500 bg-opacity-80 flex items-center justify-center">
                                    <div className="text-white text-xs font-medium text-center px-1">
                                        {t("Error")}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Remove button */}
                        <button
                            onClick={() => onRemoveFile(file.id)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
                        >
                            <IoClose className="w-3 h-3 text-white" />
                        </button>

                        {/* Progress bar at bottom */}
                        {file.isUploading && file.progress !== undefined && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 transition-all duration-300"
                                    style={{ width: `${file.progress}%` }}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PendingFilesList;
