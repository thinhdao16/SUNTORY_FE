import * as React from "react";

type Info = { x: number; y: number; target: HTMLElement };

export function useLongPressOpen(threshold = 320) {
  const timerRef = React.useRef<number | null>(null);
  const startRef = React.useRef<{ x: number; y: number } | null>(null);
  const targetRef = React.useRef<HTMLElement | null>(null);
  const suppressClickRef = React.useRef(false);

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
    targetRef.current = null;
  };

  const kick = (cb: (info: Info) => void) => {
    timerRef.current = window.setTimeout(() => {
      if (targetRef.current) {
        suppressClickRef.current = true;
        const { x, y } = startRef.current || { x: 0, y: 0 };
        cb({ x, y, target: targetRef.current });
      }
    }, threshold);
  };

  // Pointer (nếu có)
  const onPointerDown = (cb: (info: Info) => void) => (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    targetRef.current = e.currentTarget as HTMLElement;
    startRef.current = { x: e.clientX, y: e.clientY };
    kick(cb);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!startRef.current) return;
    const dx = Math.abs(e.clientX - startRef.current.x);
    const dy = Math.abs(e.clientY - startRef.current.y);
    if (dx > 8 || dy > 8) clear();
  };
  const onPointerUp = () => clear();
  const onPointerCancel = () => clear();

  // Touch fallback
  const onTouchStart = (cb: (info: Info) => void) => (e: React.TouchEvent) => {
    const t = e.touches[0];
    targetRef.current = e.currentTarget as HTMLElement;
    startRef.current = { x: t.clientX, y: t.clientY };
    kick(cb);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!startRef.current) return;
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - startRef.current.x);
    const dy = Math.abs(t.clientY - startRef.current.y);
    if (dx > 8 || dy > 8) clear();
  };
  const onTouchEnd = () => clear();
  const onTouchCancel = () => clear();

  // Chặn click ngay sau long-press
  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
    }
  };

  // Chuột phải trên desktop
  const onContextMenu = (cb: (info: Info) => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    cb({ x: e.clientX, y: e.clientY, target: e.currentTarget as HTMLElement });
  };

  const bind = (cb: (info: Info) => void) => ({
    onPointerDown: onPointerDown(cb),
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onTouchStart: onTouchStart(cb),
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
    onClickCapture,
    onContextMenu: onContextMenu(cb),
  });

  return { bind };
}
