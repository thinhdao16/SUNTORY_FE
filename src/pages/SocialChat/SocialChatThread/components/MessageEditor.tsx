import React, { useState, useRef, useEffect } from "react";

interface MessageEditorProps {
    initialText: string;
    onSave: (text: string) => void;
    onCancel: () => void;
    isUser: boolean;
}

export const MessageEditor: React.FC<MessageEditorProps> = ({
    initialText,
    onSave,
    onCancel,
    isUser
}) => {
    const [editText, setEditText] = useState(initialText);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSave = () => {
        if (editText.trim() !== "" && editText !== initialText) {
            onSave(editText.trim());
        } else {
            onCancel();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, []);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [editText]);

    return (
        <div className={`relative ${isUser ? "ml-auto" : ""} max-w-[calc(100vw-80px)]`}>
            <div className="bg-white border-2 border-blue-500 rounded-lg p-2 shadow-lg">
                <textarea
                    ref={textareaRef}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full resize-none border-none outline-none text-[15px] min-h-[60px]"
                    placeholder="Nhập tin nhắn..."
                    style={{ maxWidth: "350px" }}
                />
                <div className="flex justify-end gap-2 mt-2 pt-2 border-t">
                    <button
                        onClick={onCancel}
                        className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={editText.trim() === "" || editText === initialText}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        Lưu
                    </button>
                </div>
            </div>
            <div className="text-xs text-gray-500 mt-1 text-center">
                Enter để lưu • Esc để hủy
            </div>
        </div>
    );
};