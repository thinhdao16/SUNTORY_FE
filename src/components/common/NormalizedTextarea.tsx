import React from 'react';

export interface NormalizedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onValueChange: (v: string) => void;
  onPasteImage?: (file: File) => void | Promise<void>;
}

const normalize = (s: string) => {
  try { s = s.normalize('NFKC'); } catch {}
  s = s.replace(/\u00A0/g, ' ');
  s = s.replace(/[\u200B-\u200D\u2060\uFEFF\uFE0E\uFE0F]/g, '');
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  return s;
};

const NormalizedTextarea = React.forwardRef<HTMLTextAreaElement, NormalizedTextareaProps>(
  ({ value, onValueChange, onPasteImage, onPaste, ...rest }, ref) => {
    const handlePaste: React.ClipboardEventHandler<HTMLTextAreaElement> = async (e) => {
      const cd = e.clipboardData;
      const text = cd?.getData('text/plain') || '';
      const items = cd?.items || [];
      if (text) {
        e.preventDefault();
        const ta = e.currentTarget;
        const norm = normalize(text);
        const start = (ta?.selectionStart ?? value.length);
        const end = (ta?.selectionEnd ?? start);
        const next = value.slice(0, start) + norm + value.slice(end);
        onValueChange(next);
        setTimeout(() => {
          try { ta.setSelectionRange(start + norm.length, start + norm.length); } catch {}
        }, 0);
      }
      if (items && onPasteImage) {
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) await onPasteImage(file);
          }
        }
      }
      if (onPaste) onPaste(e);
    };

    return (
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onPaste={handlePaste}
        {...rest}
      />
    );
  }
);

export default NormalizedTextarea;
