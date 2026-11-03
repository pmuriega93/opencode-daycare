"use client";

import { useEffect } from "react";

type ToastProps = {
  message: string;
  onDismiss: () => void;
  duration?: number;
};

export function Toast({ message, onDismiss, duration = 2500 }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [message, duration, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2"
    >
      <div className="rounded-full bg-text px-5 py-3 text-[14px] font-extrabold text-white shadow-[0_12px_30px_-12px_rgba(63,54,46,.7)]">
        {message}
      </div>
    </div>
  );
}
