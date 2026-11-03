"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: "sm" | "md";
  children: ReactNode;
};

const SIZE_CLASSES = {
  sm: "max-w-[480px]",
  md: "max-w-[520px]",
} as const;

export function Modal({
  open,
  onClose,
  title,
  size = "md",
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Maneja el <dialog> nativo según la prop `open`.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
      // showModal() enfoca el primer enfocable (los botones del header);
      // preferir el elemento marcado con data-autofocus.
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Esc (cancel nativo) y cualquier otro cierre terminan en "close";
  // sincronizamos el estado del padre desde ahí.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onCloseRef.current();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClick={(event) => {
        // Los clicks sobre el ::backdrop tienen como target el <dialog>.
        if (event.target === event.currentTarget) {
          onCloseRef.current();
        }
      }}
      className={`inset-0 m-auto max-h-[85vh] w-[calc(100%_-_32px)] overflow-y-auto rounded-[24px] border border-line bg-canvas-soft p-0 text-text shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)] backdrop:bg-[rgba(63,54,46,.45)] ${SIZE_CLASSES[size]}`}
    >
      <span id={titleId} className="sr-only">
        {title}
      </span>
      {children}
    </dialog>
  );
}
