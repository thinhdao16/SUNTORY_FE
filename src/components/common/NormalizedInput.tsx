import React from 'react';

export interface NormalizedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string | number | readonly string[];
  onValueChange?: (v: string) => void;
}

const normalize = (s: string) => {
  try { s = s.normalize('NFKC'); } catch {}
  s = s.replace(/\u00A0/g, ' ');
  s = s.replace(/[\u200B-\u200D\u2060\uFEFF\uFE0E\uFE0F]/g, '');
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  return s;
};

const NormalizedInput = React.forwardRef<HTMLInputElement, NormalizedInputProps>(
  ({ value, onValueChange, onPaste, onChange, ...rest }, ref) => {
    const handlePaste: React.ClipboardEventHandler<HTMLInputElement> = (e) => {
      const cd = e.clipboardData;
      const text = cd?.getData('text/plain') || '';
      if (!text) { onPaste?.(e); return; }

      const input = e.currentTarget;
      const norm = normalize(text);

      // Always prevent default and compute next from currentTarget.value (works for controlled/uncontrolled)
      e.preventDefault();
      const before = input.value ?? '';
      const start = input.selectionStart ?? before.length;
      const end = input.selectionEnd ?? start;
      const next = before.slice(0, start) + norm + before.slice(end);
      // If controlled via onValueChange, delegate upward; else mutate DOM value
      if (onValueChange) {
        onValueChange(next);
      } else {
        try {
          input.setRangeText(norm, start, end, 'end');
        } catch {
          input.value = next;
          try { input.setSelectionRange(start + norm.length, start + norm.length); } catch {}
        }
        if (onChange) {
          const synthetic = {
            ...e,
            target: { ...e.target, value: input.value },
            currentTarget: { ...e.currentTarget, value: input.value },
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          onChange(synthetic);
        }
      }
    };

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      if (onValueChange) onValueChange(e.target.value);
      if (onChange) onChange(e);
    };

    return (
      <input
        ref={ref}
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        {...rest}
      />
    );
  }
);

export default NormalizedInput;
